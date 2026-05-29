import User from '../models/User.js';
import GameResult from '../models/GameResult.js';
import { recordGameResult } from '../utils/gameLogic.js';

export default function setupGameSockets(io) {
  const activeGames = new Map();
  const userSockets = new Map();
  
  io.on('connection', (socket) => {
    console.log(`[Game] User connected: ${socket.id}`);
    
    // User joins with authentication
    socket.on('join_game', async (data) => {
      try {
        const { userId, username } = data;
        userSockets.set(userId, socket.id);
        socket.join(`user:${userId}`);
        
        // Notify others
        io.emit('user_joined', { username, timestamp: new Date() });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    // Coinflip multiplayer battle
    socket.on('coinflip_challenge', async (data) => {
      try {
        const { challengerId, challengerName, targetId, betAmount } = data;
        
        const targetSocket = userSockets.get(targetId);
        if (!targetSocket) {
          socket.emit('error', { message: 'Target player not available' });
          return;
        }
        
        const gameId = `coinflip_${Date.now()}`;
        activeGames.set(gameId, {
          type: 'coinflip',
          challenger: challengerId,
          target: targetId,
          betAmount,
          status: 'waiting'
        });
        
        // Notify target
        io.to(`user:${targetId}`).emit('coinflip_challenge', {
          gameId,
          challengerId,
          challengerName,
          betAmount
        });
        
        socket.emit('challenge_sent', { gameId });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    socket.on('coinflip_accept', async (data) => {
      try {
        const { gameId, playerId, playerName } = data;
        const game = activeGames.get(gameId);
        
        if (!game || game.status !== 'waiting') {
          socket.emit('error', { message: 'Game not available' });
          return;
        }
        
        game.status = 'in_progress';
        game.responder = playerId;
        
        // Generate result
        const coinResult = Math.random() > 0.5 ? 'heads' : 'tails';
        const challengerWins = Math.random() > 0.5;
        
        const winners = challengerWins ? [game.challenger] : [game.responder];
        const loser = challengerWins ? game.responder : game.challenger;
        
        // Update balances
        const challenger = await User.findById(game.challenger);
        const responder = await User.findById(game.responder);
        
        if (challengerWins) {
          challenger.adjustBalance(game.betAmount);
          responder.adjustBalance(-game.betAmount);
        } else {
          responder.adjustBalance(game.betAmount);
          challenger.adjustBalance(-game.betAmount);
        }
        
        challenger.stats.totalGames += 1;
        responder.stats.totalGames += 1;
        
        if (challengerWins) {
          challenger.stats.wins += 1;
          responder.stats.losses += 1;
        } else {
          responder.stats.wins += 1;
          challenger.stats.losses += 1;
        }
        
        await challenger.save();
        await responder.save();
        
        // Notify both players
        const result = {
          gameId,
          coinResult,
          winner: challengerWins ? game.challenger : game.responder,
          winnerName: challengerWins ? challenger.username : responder.username,
          betAmount: game.betAmount,
          timestamp: new Date()
        };
        
        io.to(`user:${game.challenger}`).emit('coinflip_result', result);
        io.to(`user:${game.responder}`).emit('coinflip_result', result);
        
        // Record to live feed
        io.emit('game_completed', result);
        
        activeGames.delete(gameId);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    socket.on('coinflip_decline', (data) => {
      const { gameId, reason } = data;
      const game = activeGames.get(gameId);
      
      if (game) {
        io.to(`user:${game.challenger}`).emit('challenge_declined', { gameId, reason });
        activeGames.delete(gameId);
      }
    });
    
    // Live crash game
    socket.on('join_crash', (data) => {
      const { userId } = data;
      socket.join('crash_room');
      io.to('crash_room').emit('player_joined_crash', { userId });
    });
    
    socket.on('crash_bet', async (data) => {
      try {
        const { userId, betAmount } = data;
        const user = await User.findById(userId);
        
        if (!user || user.balance < betAmount) {
          socket.emit('error', { message: 'Insufficient balance' });
          return;
        }
        
        user.balance -= betAmount;
        await user.save();
        
        io.to('crash_room').emit('crash_bet_placed', {
          username: user.username,
          betAmount,
          userId
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    socket.on('crash_cashout', async (data) => {
      try {
        const { userId, currentMultiplier, betAmount } = data;
        const winAmount = Math.floor(betAmount * currentMultiplier);
        
        const user = await User.findById(userId);
        user.adjustBalance(winAmount);
        user.stats.totalGames += 1;
        user.stats.wins += 1;
        await user.save();
        
        io.to('crash_room').emit('player_cashedout', {
          username: user.username,
          multiplier: currentMultiplier,
          winAmount
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    socket.on('disconnect', () => {
      console.log(`[Game] User disconnected: ${socket.id}`);
    });
  });
}

import User from '../models/User.js';
import GameResult from '../models/GameResult.js';
import { recordGameResult } from '../utils/gameLogic.js';
import { delay } from '../utils/helpers.js';

// Coinflip game
export const playCoinflip = async (req, res) => {
  try {
    const { betAmount, playerChoice } = req.body;
    
    if (betAmount < 100) {
      return res.status(400).json({ error: 'Minimum bet is $100' });
    }
    
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    if (user.balance < betAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Simulate coin flip
    const coinResult = Math.random() > 0.5 ? 'heads' : 'tails';
    const won = playerChoice.toLowerCase() === coinResult;
    
    const winAmount = won ? betAmount * 2 : 0;
    
    await recordGameResult(
      req.userId,
      'coinflip',
      betAmount,
      winAmount,
      won ? 2 : 0,
      { playerChoice, result: coinResult }
    );
    
    const updatedUser = await User.findById(req.userId);
    
    res.json({
      result: coinResult,
      won,
      betAmount,
      winAmount,
      newBalance: updatedUser.balance,
      xpGained: won ? 15 : 10
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crash game
export const startCrash = async (req, res) => {
  try {
    const { betAmount } = req.body;
    
    if (betAmount < 100) {
      return res.status(400).json({ error: 'Minimum bet is $100' });
    }
    
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    if (user.balance < betAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Deduct bet immediately
    user.balance -= betAmount;
    await user.save();
    
    // Generate crash point (between 1.0 and 10.0)
    const crashPoint = parseFloat((1 + Math.random() * 9).toFixed(2));
    
    res.json({
      gameId: Date.now(),
      crashPoint,
      betAmount,
      newBalance: user.balance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cashout from crash
export const cashoutCrash = async (req, res) => {
  try {
    const { gameId, currentMultiplier } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // This would be validated against server-side state in real implementation
    const betAmount = parseFloat(req.body.betAmount) || 1000;
    const winAmount = Math.floor(betAmount * currentMultiplier);
    
    await recordGameResult(
      req.userId,
      'crash',
      betAmount,
      winAmount,
      currentMultiplier,
      { multiplier: currentMultiplier }
    );
    
    const updatedUser = await User.findById(req.userId);
    
    res.json({
      winAmount,
      newBalance: updatedUser.balance,
      won: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Jackpot wheel
export const spinWheel = async (req, res) => {
  try {
    const { betAmount } = req.body;
    
    if (betAmount < 100) {
      return res.status(400).json({ error: 'Minimum bet is $100' });
    }
    
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    if (user.balance < betAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Wheel segments with multipliers
    const wheelSegments = [
      { multiplier: 0, label: 'Lose', weight: 40 },
      { multiplier: 1, label: 'Break Even', weight: 20 },
      { multiplier: 2, label: '2x', weight: 15 },
      { multiplier: 3, label: '3x', weight: 10 },
      { multiplier: 5, label: '5x', weight: 8 },
      { multiplier: 10, label: '10x', weight: 5 },
      { multiplier: 50, label: 'JACKPOT 50x', weight: 2 }
    ];
    
    // Weighted random selection
    const totalWeight = wheelSegments.reduce((sum, seg) => sum + seg.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedSegment = wheelSegments[0];
    
    for (let segment of wheelSegments) {
      random -= segment.weight;
      if (random <= 0) {
        selectedSegment = segment;
        break;
      }
    }
    
    const winAmount = betAmount * selectedSegment.multiplier;
    const won = selectedSegment.multiplier > 1;
    
    await recordGameResult(
      req.userId,
      'jackpot',
      betAmount,
      winAmount,
      selectedSegment.multiplier,
      { segment: selectedSegment.label }
    );
    
    const updatedUser = await User.findById(req.userId);
    
    res.json({
      segment: selectedSegment.label,
      multiplier: selectedSegment.multiplier,
      winAmount,
      newBalance: updatedUser.balance,
      won,
      isJackpot: selectedSegment.multiplier >= 50
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

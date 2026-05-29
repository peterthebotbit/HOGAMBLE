import User from '../models/User.js';
import RedeemCode from '../models/RedeemCode.js';
import { calculateXPReward } from './helpers.js';

export const claimDailyReward = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  
  const now = new Date();
  const lastClaimed = user.dailyReward.lastClaimed ? new Date(user.dailyReward.lastClaimed) : null;
  
  // Check if already claimed today
  if (lastClaimed) {
    const lastClaimedDate = new Date(lastClaimed.getFullYear(), lastClaimed.getMonth(), lastClaimed.getDate());
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (lastClaimedDate.getTime() === todayDate.getTime()) {
      throw new Error('Daily reward already claimed today');
    }
    
    // Check if streak is still active (within 48 hours)
    const timeDiff = now.getTime() - lastClaimed.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff > 48) {
      user.dailyReward.streak = 0;
    }
  }
  
  // Update streak
  user.dailyReward.streak = (user.dailyReward.streak || 0) + 1;
  user.dailyReward.lastClaimed = now;
  
  // Calculate reward based on streak
  const baseReward = 10000;
  const streakMultiplier = Math.min(1 + (user.dailyReward.streak - 1) * 0.1, 2);
  const totalReward = Math.floor(baseReward * streakMultiplier);
  
  user.adjustBalance(totalReward);
  user.addXP(100 * user.dailyReward.streak);
  
  await user.save();
  
  return {
    reward: totalReward,
    streak: user.dailyReward.streak,
    xp: 100 * user.dailyReward.streak
  };
};

export const redeemCode = async (userId, code) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  
  const redeemCode = await RedeemCode.findOne({ code: code.toUpperCase() });
  if (!redeemCode) throw new Error('Invalid code');
  
  if (!redeemCode.isActive) throw new Error('Code is not active');
  
  // Check expiration
  if (redeemCode.expiresAt && new Date() > redeemCode.expiresAt) {
    throw new Error('Code has expired');
  }
  
  // Check max uses
  if (redeemCode.maxUses !== -1 && redeemCode.currentUses >= redeemCode.maxUses) {
    throw new Error('Code has reached max uses');
  }
  
  // Check if user already used this code
  const alreadyUsed = redeemCode.usedBy.some(u => u.userId.toString() === userId.toString());
  if (alreadyUsed) throw new Error('You have already used this code');
  
  // Apply rewards
  if (redeemCode.reward.balance) {
    user.adjustBalance(redeemCode.reward.balance);
  }
  
  if (redeemCode.reward.xp) {
    user.addXP(redeemCode.reward.xp);
  }
  
  // Add items to inventory
  if (redeemCode.reward.items && redeemCode.reward.items.length > 0) {
    for (let item of redeemCode.reward.items) {
      const existingItem = user.inventory.find(inv => inv.itemId === item.itemId);
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        user.inventory.push({
          itemId: item.itemId,
          name: item.name || item.itemId,
          quantity: item.quantity,
          acquiredAt: new Date()
        });
      }
    }
  }
  
  // Update redeem code
  redeemCode.usedBy.push({
    userId,
    usedAt: new Date()
  });
  redeemCode.currentUses += 1;
  
  await user.save();
  await redeemCode.save();
  
  return {
    balanceAdded: redeemCode.reward.balance,
    xpAdded: redeemCode.reward.xp,
    itemsAdded: redeemCode.reward.items
  };
};

export const recordGameResult = async (userId, gameType, betAmount, winAmount, multiplier = 1, details = null) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  
  const result = winAmount >= betAmount ? 'win' : winAmount > 0 ? 'draw' : 'loss';
  const won = result === 'win';
  
  // Update balance
  const netWinnings = winAmount - betAmount;
  if (netWinnings !== 0) {
    user.adjustBalance(netWinnings);
  }
  
  // Update stats
  user.stats.totalGames += 1;
  if (won) {
    user.stats.wins += 1;
    user.stats.currentStreak = (user.stats.currentStreak || 0) + 1;
  } else {
    user.stats.losses += 1;
    if ((user.stats.currentStreak || 0) > (user.stats.longestStreak || 0)) {
      user.stats.longestStreak = user.stats.currentStreak;
    }
    user.stats.currentStreak = 0;
  }
  
  if (winAmount > (user.stats.biggestWin || 0)) {
    user.stats.biggestWin = winAmount;
  }
  
  // Award XP
  const xpReward = calculateXPReward(gameType, betAmount, won);
  user.addXP(xpReward);
  
  // Save user
  await user.save();
  
  // Create game result record
  const { GameResult } = await import('../models/GameResult.js');
  const gameResult = new GameResult({
    userId,
    username: user.username,
    gameType,
    betAmount,
    winnings: winAmount,
    multiplier,
    result,
    details,
    xpGained: xpReward
  });
  
  await gameResult.save();
  
  return {
    newBalance: user.balance,
    xpGained: xpReward,
    leveledUp: user.level,
    result
  };
};

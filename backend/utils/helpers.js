import jwt from 'jsonwebtoken';

export const generateToken = (userId, username) => {
  return jwt.sign(
    { userId, username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const generateRandomCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const calculateXPReward = (gameType, betAmount, won) => {
  const baseXP = {
    coinflip: 10,
    crash: 15,
    jackpot: 25,
    case: 20,
    daily_bonus: 50
  };
  
  const multiplier = Math.min(Math.max(betAmount / 1000, 0.5), 3);
  const winBonus = won ? 1.5 : 1;
  
  return Math.floor((baseXP[gameType] || 10) * multiplier * winBonus);
};

export const calculateRankFromLevel = (level) => {
  if (level >= 100) return 'Master';
  if (level >= 75) return 'Platinum';
  if (level >= 50) return 'Diamond';
  if (level >= 30) return 'Gold';
  if (level >= 15) return 'Silver';
  return 'Bronze';
};

export const getRandomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

export const weightedRandom = (items) => {
  // items format: [{ item: X, weight: Y }, ...]
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (let item of items) {
    random -= item.weight;
    if (random <= 0) return item.item;
  }
  
  return items[0].item;
};

export const validateEmail = (email) => {
  const re = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  return re.test(email);
};

export const formatMoney = (amount) => {
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(2) + 'M';
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(2) + 'K';
  }
  return amount.toFixed(2);
};

export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

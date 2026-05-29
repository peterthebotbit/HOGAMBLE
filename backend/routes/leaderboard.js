import express from 'express';
import User from '../models/User.js';
import Leaderboard from '../models/Leaderboard.js';

const router = express.Router();

// Get top players by profit
router.get('/profit', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    const leaderboard = await User.find({ isBanned: false })
      .sort({ 'stats.totalProfit': -1 })
      .limit(parseInt(limit))
      .select('username level rank stats.wins stats.losses stats.totalProfit avatar');
    
    const withRank = leaderboard.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      level: user.level,
      rank: user.rank,
      wins: user.stats.wins,
      losses: user.stats.losses,
      profit: user.stats.totalProfit,
      avatar: user.avatar
    }));
    
    res.json(withRank);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top players by level
router.get('/level', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    const leaderboard = await User.find({ isBanned: false })
      .sort({ level: -1, xp: -1 })
      .limit(parseInt(limit))
      .select('username level rank stats avatar');
    
    const withRank = leaderboard.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      level: user.level,
      rank: user.rank,
      avatar: user.avatar
    }));
    
    res.json(withRank);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top players by wins
router.get('/wins', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    const leaderboard = await User.find({ isBanned: false })
      .sort({ 'stats.wins': -1 })
      .limit(parseInt(limit))
      .select('username level stats.wins stats.losses avatar');
    
    const withRank = leaderboard.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      level: user.level,
      wins: user.stats.wins,
      losses: user.stats.losses,
      avatar: user.avatar
    }));
    
    res.json(withRank);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

import User from '../models/User.js';
import GameResult from '../models/GameResult.js';
import { claimDailyReward, redeemCode, recordGameResult } from '../utils/gameLogic.js';

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json(user.getPublicProfile());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { username, theme } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Check username uniqueness
    if (username && username !== user.username) {
      const exists = await User.findOne({ username });
      if (exists) return res.status(400).json({ error: 'Username already taken' });
      user.username = username;
    }
    
    if (theme && ['dark', 'neon', 'cyberpunk'].includes(theme)) {
      user.theme = theme;
    }
    
    await user.save();
    res.json({ message: 'Profile updated', user: user.getPublicProfile() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.avatar = req.file.filename;
    await user.save();
    
    res.json({ avatar: user.avatar });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const claimDaily = async (req, res) => {
  try {
    const result = await claimDailyReward(req.userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getInventory = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json(user.inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const redeem = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Code required' });
    
    const result = await redeemCode(req.userId, code);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({
      stats: user.stats,
      level: user.level,
      rank: user.rank,
      balance: user.balance,
      totalEarned: user.totalEarned,
      totalSpent: user.totalSpent
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getGameHistory = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const results = await GameResult.find({ userId: req.userId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    const total = await GameResult.countDocuments({ userId: req.userId });
    
    res.json({ results, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json(user.settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { musicEnabled, soundsEnabled, notifications } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    if (musicEnabled !== undefined) user.settings.musicEnabled = musicEnabled;
    if (soundsEnabled !== undefined) user.settings.soundsEnabled = soundsEnabled;
    if (notifications !== undefined) user.settings.notifications = notifications;
    
    await user.save();
    res.json(user.settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

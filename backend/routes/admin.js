import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Admin middleware
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

router.use(requireAdmin);

// Ban user
router.post('/ban/:userId', async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isBanned: true, banReason: reason },
      { new: true }
    );
    res.json({ message: 'User banned', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unban user
router.post('/unban/:userId', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isBanned: false, banReason: null },
      { new: true }
    );
    res.json({ message: 'User unbanned', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user info
router.get('/user/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

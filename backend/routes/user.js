import express from 'express';
import multer from 'multer';
import { 
  getProfile, 
  updateProfile, 
  uploadAvatar,
  claimDaily,
  getInventory,
  redeem,
  getStats,
  getGameHistory,
  getSettings,
  updateSettings
} from '../controllers/userController.js';

const router = express.Router();

const upload = multer({
  dest: './uploads',
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.post('/daily', claimDaily);
router.get('/inventory', getInventory);
router.post('/redeem', redeem);
router.get('/stats', getStats);
router.get('/history', getGameHistory);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;

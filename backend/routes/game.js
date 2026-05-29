import express from 'express';
import { 
  playCoinflip,
  startCrash,
  cashoutCrash,
  spinWheel
} from '../controllers/gameController.js';

const router = express.Router();

router.post('/coinflip', playCoinflip);
router.post('/crash/start', startCrash);
router.post('/crash/cashout', cashoutCrash);
router.post('/wheel/spin', spinWheel);

export default router;

import express from 'express';
import { authUser, registerUser, updatePushToken } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.put('/profile/push-token', protect, updatePushToken);

export default router;

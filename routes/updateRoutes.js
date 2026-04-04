import express from 'express';
import { getUpdates, createUpdate, deleteUpdate } from '../controllers/updateController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getUpdates)
  .post(protect, admin, createUpdate);

router.route('/:id').delete(protect, admin, deleteUpdate);

export default router;

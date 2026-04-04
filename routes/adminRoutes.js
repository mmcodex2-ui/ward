import express from 'express';
import {
  getAnalytics,
  getAllUsers,
  toggleBlockUser,
  deleteUser,
  createAdmin,
  revokeAdmin,
  exportUsers,
} from '../controllers/adminController.js';
import { protect, admin, developer } from '../middleware/authMiddleware.js';

const router = express.Router();

// All admin routes require authentication
router.use(protect);

// Analytics — admin + developer
router.get('/analytics', admin, getAnalytics);

// User listing + management — admin + developer
router.get('/users', admin, getAllUsers);
router.put('/users/:id/block', admin, toggleBlockUser);
router.delete('/users/:id', developer, deleteUser);

// Admin creation & revocation — developer only
router.post('/admins', developer, createAdmin);
router.put('/admins/:id/revoke', developer, revokeAdmin);

// Export
router.get('/export/users', admin, exportUsers);

export default router;

import express from 'express';
import {
  createComplaint,
  getMyComplaints,
  getComplaints,
  updateComplaintStatus,
} from '../controllers/complaintController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createComplaint).get(protect, admin, getComplaints);
router.route('/my').get(protect, getMyComplaints);
router.route('/:id/status').put(protect, admin, updateComplaintStatus);

export default router;

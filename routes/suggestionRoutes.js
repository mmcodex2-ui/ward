import express from 'express';
import { createSuggestion, getSuggestions, getMySuggestions, reviewSuggestion } from '../controllers/suggestionController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createSuggestion)
  .get(protect, admin, getSuggestions);

router.route('/my').get(protect, getMySuggestions);
router.route('/:id/review').put(protect, admin, reviewSuggestion);

export default router;

import asyncHandler from 'express-async-handler';
import Suggestion from '../models/Suggestion.js';

// @desc    Create a suggestion
// @route   POST /api/suggestions
// @access  Private
const createSuggestion = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    res.status(400);
    throw new Error('Please provide title and description');
  }

  const suggestion = await Suggestion.create({
    user: req.user._id,
    title,
    description,
  });

  res.status(201).json(suggestion);
});

// @desc    Get all suggestions (Admin)
// @route   GET /api/suggestions
// @access  Private/Admin
const getSuggestions = asyncHandler(async (req, res) => {
  const suggestions = await Suggestion.find({})
    .populate('user', 'id name email')
    .sort({ createdAt: -1 });
  res.json(suggestions);
});

// @desc    Get my suggestions
// @route   GET /api/suggestions/my
// @access  Private
const getMySuggestions = asyncHandler(async (req, res) => {
  const suggestions = await Suggestion.find({ user: req.user._id })
    .sort({ createdAt: -1 });
  res.json(suggestions);
});

// @desc    Mark suggestion as reviewed (Admin)
// @route   PUT /api/suggestions/:id/review
// @access  Private/Admin
const reviewSuggestion = asyncHandler(async (req, res) => {
  const suggestion = await Suggestion.findById(req.params.id);

  if (suggestion) {
    suggestion.status = 'Reviewed';
    const updated = await suggestion.save();
    res.json(updated);
  } else {
    res.status(404);
    throw new Error('Suggestion not found');
  }
});

export { createSuggestion, getSuggestions, getMySuggestions, reviewSuggestion };

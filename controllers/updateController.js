import asyncHandler from 'express-async-handler';
import Update from '../models/Update.js';
import User from '../models/User.js';
import { sendPushNotification } from '../utils/sendNotification.js';

// @desc    Get all ward updates (public)
// @route   GET /api/updates
// @access  Private
const getUpdates = asyncHandler(async (req, res) => {
  const updates = await Update.find({}).sort({ createdAt: -1 });
  res.json(updates);
});

// @desc    Create a new ward update and send push notifications
// @route   POST /api/updates
// @access  Private/Admin
const createUpdate = asyncHandler(async (req, res) => {
  const { title, description, mediaUrls } = req.body;

  if (!title || !description) {
    res.status(400);
    throw new Error('Please provide title and description');
  }

  const update = await Update.create({
    admin: req.user._id,
    title,
    description,
    mediaUrls: mediaUrls || [],
  });

  // Fetch all push tokens to send notifications (FCM)
  try {
    const usersWithTokens = await User.find({ pushToken: { $exists: true, $ne: null } }).select('pushToken');
    const tokens = usersWithTokens.map(u => u.pushToken);

    if (tokens.length > 0) {
      await sendPushNotification(
        tokens,
        'Ward Update!',
        title,
        { updateId: update._id.toString(), type: 'WARD_UPDATE' }
      );
    }
  } catch (err) {
    console.error('Failed to send ward update notifications:', err);
  }

  res.status(201).json(update);
});

// @desc    Delete a ward update
// @route   DELETE /api/updates/:id
// @access  Private/Admin
const deleteUpdate = asyncHandler(async (req, res) => {
  const update = await Update.findById(req.params.id);

  if (update) {
    await update.deleteOne();
    res.json({ message: 'Update removed' });
  } else {
    res.status(404);
    throw new Error('Update not found');
  }
});

export { getUpdates, createUpdate, deleteUpdate };

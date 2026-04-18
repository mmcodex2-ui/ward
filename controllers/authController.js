import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import admin from '../config/firebase.js';

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { phoneOrEmail, password } = req.body;

  // Sanitize input to match stored format
  const cleanInput = phoneOrEmail ? phoneOrEmail.toLowerCase().trim() : '';

  const user = await User.findOne({
    $or: [{ email: cleanInput }, { phoneNumber: cleanInput }]
  });

  if (user && (await user.matchPassword(password))) {
    if (user.isBlocked) {
      res.status(403);
      throw new Error('User account is blocked by admin.');
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(res, user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      token,
    });
  } else {
    // Debug log to help identify if it's a "not found" or "wrong password" issue
    if (!user) {
      console.log(`[Auth] User not found: ${cleanInput}`);
    } else {
      console.log(`[Auth] Password mismatch for: ${cleanInput}`);
    }

    res.status(401);
    throw new Error('Invalid email/phone or password');
  }
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, phoneNumber, password, address } = req.body;

  // Clean data
  const cleanEmail = email ? email.toLowerCase().trim() : null;
  const cleanPhone = phoneNumber && phoneNumber.trim() !== "" ? phoneNumber.trim() : null;

  const orQuery = [];
  if (cleanEmail) orQuery.push({ email: cleanEmail });
  if (cleanPhone) orQuery.push({ phoneNumber: cleanPhone });

  if (orQuery.length === 0) {
    res.status(400);
    throw new Error('Email or Phone Number is required');
  }

  // Find existing user with either email or phone
  const userExists = await User.findOne({ $or: orQuery });

  if (userExists) {
    res.status(400);
    const dupField = userExists.email === cleanEmail ? 'email' : 'phone number';
    throw new Error(`User with this ${dupField} already exists`);
  }

  const user = await User.create({
    name,
    email: cleanEmail,
    phoneNumber: cleanPhone || undefined, // Use undefined instead of null to properly trigger sparse indexing
    password,
    address,
  });

  if (user) {
    const token = generateToken(res, user._id);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      token,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Auth user with Google token
// @route   POST /api/auth/google
// @access  Public
// @desc    Auth user with Google data from mobile
// @route   POST /api/auth/google
// @access  Public
const googleAuth = asyncHandler(async (req, res) => {
  const { name, email, googleId, profilePic } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const cleanEmail = email.toLowerCase().trim();

  let user = await User.findOne({ email: cleanEmail });

  if (user) {
    // User exists, login
    // Update Google ID if not present
    if (!user.googleId) {
       user.googleId = googleId;
       await user.save();
    }
  } else {
    // User doesn't exist, Register
    user = await User.create({
      name,
      email: cleanEmail,
      googleId,
      profilePic,
      role: 'user',
      // No password needed for social login
    });
  }

  if (user.isBlocked) {
    res.status(403);
    throw new Error('User account is blocked by admin.');
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(res, user._id);

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber || '',
    role: user.role,
    profilePic: user.profilePic,
    token,
  });
});

// @desc    Update push token
// @route   PUT /api/auth/profile/push-token
// @access  Private
const updatePushToken = asyncHandler(async (req, res) => {
  const { pushToken } = req.body;

  const user = await User.findById(req.user._id);

  if (user) {
    user.pushToken = pushToken;
    await user.save();
    res.json({ message: 'Push token updated' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export { authUser, registerUser, googleAuth, updatePushToken };
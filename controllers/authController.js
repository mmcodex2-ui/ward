import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { phoneOrEmail, password } = req.body;

  const user = await User.findOne({
    $or: [{ email: phoneOrEmail }, { phoneNumber: phoneOrEmail }]
  });

  if (user && (await user.matchPassword(password))) {
    if (user.isBlocked) {
      res.status(403);
      throw new Error('User account is blocked by admin.');
    }

    // Update last login timestamp
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
    res.status(401);
    throw new Error('Invalid email/phone or password');
  }
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, phoneNumber, password, address } = req.body;

  const userExists = await User.findOne({
    $or: [{ email }, { phoneNumber }]
  });

  if (userExists) {
    res.status(400);
    throw new Error('User with this email or phone number already exists');
  }

  const user = await User.create({
    name,
    email,
    phoneNumber,
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

export { authUser, registerUser, updatePushToken };

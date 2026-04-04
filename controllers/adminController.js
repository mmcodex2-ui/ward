import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import Update from '../models/Update.js';

// ─── Analytics ─────────────────────────────────────────────────────────────

// @desc    Get full analytics overview
// @route   GET /api/admin/analytics
// @access  Admin + Developer
const getAnalytics = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfToday = new Date(now.setHours(0, 0, 0, 0));
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Users
  const totalUsers = await User.countDocuments({ role: 'user' });
  const newUsersToday = await User.countDocuments({ role: 'user', createdAt: { $gte: startOfToday } });
  const newUsersLast7Days = await User.countDocuments({ role: 'user', createdAt: { $gte: sevenDaysAgo } });
  const newUsersLast30Days = await User.countDocuments({ role: 'user', createdAt: { $gte: thirtyDaysAgo } });

  // Active users (logged in within 7 days)
  const activeUsersLast7Days = await User.countDocuments({
    role: 'user',
    lastLogin: { $gte: sevenDaysAgo }
  });

  // Complaints
  const totalComplaints = await Complaint.countDocuments();
  const pendingComplaints = await Complaint.countDocuments({ status: 'Pending' });
  const inProgressComplaints = await Complaint.countDocuments({ status: 'In Progress' });
  const resolvedComplaints = await Complaint.countDocuments({ status: 'Resolved' });
  const rejectedComplaints = await Complaint.countDocuments({ status: 'Rejected' });
  const newComplaintsToday = await Complaint.countDocuments({ createdAt: { $gte: startOfToday } });

  // Complaints by category
  const complaintsByCategory = await Complaint.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // Daily registrations for last 7 days
  const dailyRegistrations = await User.aggregate([
    { $match: { role: 'user', createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Daily complaints for last 7 days
  const dailyComplaints = await Complaint.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Total updates posted
  const totalUpdates = await Update.countDocuments();

  res.json({
    users: {
      total: totalUsers,
      newToday: newUsersToday,
      newLast7Days: newUsersLast7Days,
      newLast30Days: newUsersLast30Days,
      activeLast7Days: activeUsersLast7Days,
    },
    complaints: {
      total: totalComplaints,
      newToday: newComplaintsToday,
      pending: pendingComplaints,
      inProgress: inProgressComplaints,
      resolved: resolvedComplaints,
      rejected: rejectedComplaints,
      byCategory: complaintsByCategory,
    },
    updates: {
      total: totalUpdates,
    },
    charts: {
      dailyRegistrations,
      dailyComplaints,
    }
  });
});

// ─── User Management ────────────────────────────────────────────────────────

// @desc    Get all users (paginated)
// @route   GET /api/admin/users
// @access  Admin + Developer
const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';

  const query = {
    role: { $in: ['user', 'admin'] },
    ...(search && {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ]
    })
  };

  // Developer can see all including admins
  if (req.user.role !== 'developer') {
    query.role = 'user';
  }

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ users, total, page, pages: Math.ceil(total / limit) });
});

// @desc    Block / unblock a user
// @route   PUT /api/admin/users/:id/block
// @access  Admin + Developer
const toggleBlockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  // Prevent blocking developers
  if (user.role === 'developer') {
    res.status(403);
    throw new Error('Cannot block a developer account');
  }
  // Admin cannot block other admins — only developer can
  if (user.role === 'admin' && req.user.role !== 'developer') {
    res.status(403);
    throw new Error('Only a developer can block/unblock admin accounts');
  }

  user.isBlocked = !user.isBlocked;
  await user.save();
  res.json({ _id: user._id, name: user.name, isBlocked: user.isBlocked });
});

// @desc    Delete a user (Developer only)
// @route   DELETE /api/admin/users/:id
// @access  Developer
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (user.role === 'developer') { res.status(403); throw new Error('Cannot delete a developer account'); }
  await user.deleteOne();
  res.json({ message: 'User deleted' });
});

// ─── Admin Management (Developer only) ─────────────────────────────────────

// @desc    Create an admin account
// @route   POST /api/admin/admins
// @access  Developer
const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, phoneNumber, password, address } = req.body;

  if (!name || !email || !phoneNumber || !password) {
    res.status(400);
    throw new Error('Please provide name, email, phone and password');
  }

  const exists = await User.findOne({ $or: [{ email }, { phoneNumber }] });
  if (exists) { res.status(400); throw new Error('Email or phone already in use'); }

  const admin = await User.create({ name, email, phoneNumber, password, address, role: 'admin' });
  res.status(201).json({
    _id: admin._id,
    name: admin.name,
    email: admin.email,
    phoneNumber: admin.phoneNumber,
    role: admin.role,
  });
});

// @desc    Revoke admin → change role to user  OR delete
// @route   PUT /api/admin/admins/:id/revoke
// @access  Developer
const revokeAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (user.role !== 'admin') { res.status(400); throw new Error('User is not an admin'); }

  user.role = 'user';
  await user.save();
  res.json({ _id: user._id, name: user.name, role: user.role, message: 'Admin revoked to user' });
});

// ─── Excel Export ───────────────────────────────────────────────────────────

// @desc    Export all users as JSON (admin downloads and converts)
// @route   GET /api/admin/export/users
// @access  Admin + Developer
const exportUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: { $in: ['user', 'admin'] } })
    .select('-password')
    .sort({ createdAt: -1 });

  // Set headers so browser triggers download as CSV
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="users_export.csv"');

  const header = 'Name,Email,Phone,Address,Role,Blocked,Last Login,Registered At\n';
  const rows = users.map(u =>
    `"${u.name}","${u.email}","${u.phoneNumber}","${u.address || ''}","${u.role}","${u.isBlocked}","${u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'N/A'}","${new Date(u.createdAt).toLocaleString()}"`
  ).join('\n');

  res.send(header + rows);
});

export {
  getAnalytics,
  getAllUsers,
  toggleBlockUser,
  deleteUser,
  createAdmin,
  revokeAdmin,
  exportUsers,
};

import asyncHandler from 'express-async-handler';
import Complaint from '../models/Complaint.js';

// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Private
const createComplaint = asyncHandler(async (req, res) => {
  const { title, description, category, locationAddress, locationCoordinates, mediaUrl } = req.body;

  if (!title || !description || !locationAddress || !locationCoordinates) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  const complaint = new Complaint({
    user: req.user._id,
    title,
    description,
    category,
    locationAddress,
    locationCoordinates,
    mediaUrl: mediaUrl || [],
  });

  const createdComplaint = await complaint.save();
  res.status(201).json(createdComplaint);
});

// @desc    Get user complaints
// @route   GET /api/complaints/my
// @access  Private
const getMyComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(complaints);
});

// @desc    Get all complaints (Admin)
// @route   GET /api/complaints
// @access  Private/Admin
const getComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find({}).populate('user', 'id name email phoneNumber').sort({ createdAt: -1 });
  res.json(complaints);
});

// @desc    Update complaint status (Admin)
// @route   PUT /api/complaints/:id/status
// @access  Private/Admin
const updateComplaintStatus = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);

  if (complaint) {
    const { status, adminRemarks, resolutionMedia, resolutionNote } = req.body;
    
    complaint.status = status || complaint.status;
    complaint.adminRemarks = adminRemarks || complaint.adminRemarks;
    
    if (resolutionMedia) {
      complaint.resolutionMedia = resolutionMedia;
    }
    
    if (resolutionNote) {
      complaint.resolutionNote = resolutionNote;
    }

    const updatedComplaint = await complaint.save();
    res.json(updatedComplaint);
  } else {
    res.status(404);
    throw new Error('Complaint not found');
  }
});

export { createComplaint, getMyComplaints, getComplaints, updateComplaintStatus };

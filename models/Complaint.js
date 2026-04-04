import mongoose from 'mongoose';

const complaintSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['water', 'road', 'electricity', 'garbage', 'other'],
      default: 'other',
    },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
      default: 'Pending',
    },
    locationAddress: {
      type: String,
      required: true,
    },
    locationCoordinates: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
    },
    mediaUrl: {
      type: [String],
      required: true, // User must upload image/video
    },
    adminRemarks: {
      type: String,
      required: false,
    },
    resolutionMedia: {
      type: [String], // Proof from admin when resolved
      default: [],
    },
    resolutionNote: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;

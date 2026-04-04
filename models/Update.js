import mongoose from 'mongoose';

const updateSchema = mongoose.Schema(
  {
    admin: {
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
    mediaUrls: {
      type: [String],
      default: [],
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Update = mongoose.model('Update', updateSchema);
export default Update;

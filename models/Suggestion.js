import mongoose from 'mongoose';

const suggestionSchema = mongoose.Schema(
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
    status: {
      type: String,
      enum: ['Pending', 'Reviewed'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

const Suggestion = mongoose.model('Suggestion', suggestionSchema);
export default Suggestion;

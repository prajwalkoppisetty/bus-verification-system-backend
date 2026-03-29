import mongoose from 'mongoose';

const coordinatorSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'coordinator'
  },
  name: {
    type: String,
    required: true
  },
  busRoute: {
    type: String,
    required: true
  }
}, { timestamps: true });

const Coordinator = mongoose.model('Coordinator', coordinatorSchema);
export default Coordinator;

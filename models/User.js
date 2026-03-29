import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  regNumber: {
    type: String,
    required: true,
    unique: true,
    // Using simple validate or minlength/maxlength 
    // assuming some flexibility, but strictly "10 characters long" requested:
    minlength: 10,
    maxlength: 10,
    uppercase: true, // Typically reg numbers like 21BCE00000 are uppercase
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'coordinator', 'admin'],
    default: 'student'
  },
  name: {
    type: String,
    required: true
  },
  branch: {
    type: String,
    default: ''
  },
  busRoute: {
    type: String,
    default: ''
  },
  passId: {
    type: String,
    // generated sequentially or randomly when pass is created
  },
  passValidUntil: {
    type: Date
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;

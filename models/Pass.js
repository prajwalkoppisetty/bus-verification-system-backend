import mongoose from 'mongoose';

const passSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  qrId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['ACTIVE', 'USED', 'EXPIRED'], default: 'ACTIVE' },
  generatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});

const Pass = mongoose.model('Pass', passSchema);
export default Pass;

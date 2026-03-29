import mongoose from 'mongoose';

const scanHistorySchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coordinatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  passId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pass', required: true },
  qrId: { type: String, required: true },
  busRoute: { type: String, required: true },
  status: { type: String, enum: ['VERIFIED', 'REJECTED_USED', 'REJECTED_INVALID'], required: true },
  scannedAt: { type: Date, default: Date.now }
});

const ScanHistory = mongoose.model('ScanHistory', scanHistorySchema);
export default ScanHistory;

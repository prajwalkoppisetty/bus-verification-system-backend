import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Pass from '../models/Pass.js';
import ScanHistory from '../models/ScanHistory.js';
import User from '../models/User.js';
import Coordinator from '../models/Coordinator.js';

const router = express.Router();

router.post('/verify', protect, async (req, res) => {
  try {
    if (req.user.role !== 'coordinator') {
      return res.status(403).json({ message: 'CRITICAL WARNING: Only certified coordinators can scan QR codes!' });
    }

    const { qrId } = req.body;
    if (!qrId) return res.status(400).json({ message: 'QR ID string required for verification.' });

    // Fetch the Pass and cleanly populate the Student's actual secure Database information
    const passRecord = await Pass.findOne({ qrId }).populate('studentId', 'name regNumber busRoute');
    const coordinator = await Coordinator.findById(req.user.userId);
    
    if (!passRecord) {
      // Fake or generated manually outside the DB
      return res.status(404).json({ message: 'FATAL ERROR: Pass missing or structurally invalid. Counterfeit scan.', status: 'REJECTED_INVALID' });
    }

    // Preset a tracking log locally
    const historyEntry = new ScanHistory({
      studentId: passRecord.studentId._id,
      coordinatorId: coordinator._id,
      passId: passRecord._id,
      qrId: passRecord.qrId,
      busRoute: coordinator.busRoute || passRecord.studentId.busRoute || 'General Log',
      scannedAt: new Date()
    });

    // Verify 6Hr Expiration globally
    if (new Date() > new Date(passRecord.expiresAt)) {
      passRecord.status = 'EXPIRED';
      await passRecord.save();
      historyEntry.status = 'REJECTED_INVALID';
      await historyEntry.save();
      return res.status(400).json({ message: 'This pass has fundamentally expired limit.', status: 'EXPIRED' });
    }

    // Verify Singe-Use Condition
    if (passRecord.status === 'USED') {
      historyEntry.status = 'REJECTED_USED';
      await historyEntry.save();
      return res.status(400).json({ message: 'ALREADY SCANNED! This pass was used previously.', status: 'USED', student: passRecord.studentId });
    }

    // Passed All Defenses - Burn it and Verify!
    if (passRecord.status === 'ACTIVE') {
       passRecord.status = 'USED'; // DESTROY PASS CRED VALIDITY
       await passRecord.save();
       
       historyEntry.status = 'VERIFIED';
       await historyEntry.save();

       return res.status(200).json({ 
         message: 'Pass Verified Successfully. Safe to Board.', 
         status: 'VERIFIED',
         student: passRecord.studentId
       });
    }

  } catch (error) {
    console.error("VERIFY ER:", error);
    res.status(500).json({ message: 'Server logic error during QR DB verification.' });
  }
});

// Dedicated secure endpoint to pull physical DB ledger histories dynamically for both roles
router.get('/history', protect, async (req, res) => {
  try {
    let history;
    if (req.user.role === 'coordinator') {
       history = await ScanHistory.find({ coordinatorId: req.user.userId })
          .populate('studentId', 'name regNumber')
          .populate('coordinatorId', 'name')
          .sort({ scannedAt: -1 });
    } else {
       history = await ScanHistory.find({ studentId: req.user.userId })
          .populate('studentId', 'name regNumber')
          .populate('coordinatorId', 'name')
          .sort({ scannedAt: -1 });
    }

    // Remap dynamically back into the array logic the React Table expects
    const formattedHistory = history.map(h => ({
      id: h.qrId,
      route: h.busRoute || 'N/A',
      rawDate: h.scannedAt,
      datetime: new Date(h.scannedAt).toLocaleDateString('en-GB') + ' - ' + new Date(h.scannedAt).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'}),
      location: h.coordinatorId?.name ? `By: ${h.coordinatorId.name}` : 'Scanner',
      studentName: h.studentId?.name || 'Unknown Student',
      status: h.status === 'VERIFIED' ? 'Verified' : 'Failed'
    }));

    res.status(200).json(formattedHistory);
  } catch (error) {
    console.error("HISTORY ER:", error);
    res.status(500).json({ message: "Server error fetching verifiable scan ledger" });
  }
});

export default router;

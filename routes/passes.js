import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Pass from '../models/Pass.js';
import User from '../models/User.js';

const router = express.Router();

router.post('/generate', protect, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Only registered students can systematically generate passes.' });
    }

    // Mathematical strict 6-hour check
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const existingPass = await Pass.findOne({
      studentId: req.user.userId,
      generatedAt: { $gt: sixHoursAgo }
    }).sort({ generatedAt: -1 });

    if (existingPass && existingPass.status === 'ACTIVE') {
       return res.status(400).json({ 
         message: 'You still have an active pass generated recently. Use that strictly.',
         pass: existingPass 
       });
    }

    if (existingPass) {
       // A pass exists within 6 hours (even if USED). They cannot generate another one yet.
       return res.status(429).json({ message: 'Cooldown Active! You must universally wait 6 hours between standard bus pass generations.' });
    }

    // Generate unique, strictly random QR Payload mapping for DB verification
    const customQrId = `QR-${Math.random().toString(36).substring(2,10).toUpperCase()}-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000); 

    const newPass = new Pass({
      studentId: req.user.userId,
      qrId: customQrId,
      status: 'ACTIVE',
      expiresAt: expiresAt
    });

    await newPass.save();
    
    // Fetch user details exactly as logged in for the frontend to render smoothly
    const user = await User.findById(req.user.userId);

    res.status(201).json({
       message: 'Pass physically generated and logged successfully',
       pass: newPass,
       studentInfo: {
         name: user.name,
         regNumber: user.regNumber,
         busRoute: user.busRoute
       }
    });

  } catch (error) {
    console.error("PASS GEN ERROR:", error);
    res.status(500).json({ message: 'Database/Server error generating pass limits.' });
  }
});
export default router;

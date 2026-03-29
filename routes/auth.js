import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Coordinator from '../models/Coordinator.js';

const router = express.Router();

// 1. Admin/College Endpoint to generate credentials
// This simulates the college issuing credentials when fees are paid
router.post('/generate-student', async (req, res) => {
  try {
    const { regNumber, name, branch, busRoute } = req.body || {};

    if (!regNumber || regNumber.length !== 10) {
      return res.status(400).json({ message: "Registration number must be exactly 10 characters long." });
    }

    // Check if student already exists
    const existingUser = await User.findOne({ regNumber: regNumber.toUpperCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Student with this Registration Number already exists." });
    }

    // Generate a secure random password (e.g., 8 chars)
    const rawPassword = Math.random().toString(36).slice(-8);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    // Create unique Pass ID ending in 789 for demo purposes as requested earlier
    const randomPrefix = Math.floor(100 + Math.random() * 900);
    const passId = `PASS-${randomPrefix}789`;

    // Calculate Validity (e.g., 1 month from now)
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + 1);

    const newUser = new User({
      regNumber: regNumber.toUpperCase(),
      password: hashedPassword,
      role: 'student',
      name,
      branch,
      busRoute,
      passId,
      passValidUntil: validUntil
    });

    await newUser.save();

    // Return the generated credentials back to the college admin so they can hand it to the student
    res.status(201).json({
      message: "Student credentials successfully generated.",
      credentials: {
        regNumber: newUser.regNumber,
        password: rawPassword, // ONLY sent once!
        name: newUser.name,
        passId: newUser.passId
      }
    });

  } catch (error) {
    console.error("GENERATION ERROR DETAILS:", error);
    res.status(500).json({ 
      message: "Server error generating credentials.",
      error: error.message,
      stack: error.stack
    });
  }
});

// 2. Login Endpoint
router.post('/login', async (req, res) => {
  try {
    const { regNumber, password } = req.body || {};

    if (!regNumber || !password) {
      return res.status(400).json({ message: "Please provide Registration Number and Password." });
    }

    // Find in Students Collection first
    let user = await User.findOne({ regNumber: regNumber.toUpperCase() });
    let role = 'student';

    // If not a student, check the new isolated Coordinators Collection
    if (!user) {
      user = await Coordinator.findOne({ username: regNumber.toUpperCase() });
      role = 'coordinator';
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials: ID not found in either system." });
    }

    // Compare Hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials: Bad Password." });
    }

    // Generate JWT
    const payload = {
      userId: user._id,
      role: role,
      regNumber: role === 'student' ? user.regNumber : user.username,
      name: user.name
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      message: "Login successful.",
      token,
      user: {
        name: user.name,
        regNumber: role === 'student' ? user.regNumber : user.username,
        role: role,
        branch: user.branch || null,
        busRoute: user.busRoute,
        passId: user.passId || null,
        passValidUntil: user.passValidUntil || null
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during login." });
  }
});

// 3. Admin Endpoint to generate coordinator credentials
router.post('/generate-coordinator', async (req, res) => {
  try {
    const { username, name, busRoute } = req.body || {};

    if (!username || !name || !busRoute) {
      return res.status(400).json({ message: "Username, Name, and Bus Route are all required to bind a coordinator." });
    }

    const existingUser = await User.findOne({ regNumber: username.toUpperCase() });
    const existingCoord = await Coordinator.findOne({ username: username.toUpperCase() });
    
    if (existingUser || existingCoord) {
      return res.status(400).json({ message: "Coordinator or Student with this Username/ID already exists." });
    }

    const rawPassword = Math.random().toString(36).slice(-8);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    // Creates the coordinator physically inside the new disconnected collection
    const newCoordinator = new Coordinator({
      username: username.toUpperCase(), 
      password: hashedPassword,
      name,
      busRoute,
    });

    await newCoordinator.save();

    res.status(201).json({
      message: "Coordinator credentials successfully physically isolated and generated.",
      credentials: {
        username: newCoordinator.username,
        password: rawPassword,
        name: newCoordinator.name,
        busRoute: newCoordinator.busRoute
      }
    });

  } catch (error) {
    console.error("COORD GENERATION ERROR DETAILS:", error);
    res.status(500).json({ 
      message: "Server error generating coordinator credentials.",
      error: error.message
    });
  }
});

export default router;

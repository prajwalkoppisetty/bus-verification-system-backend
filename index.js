import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB: viit-bus-verification'))
  .catch(err => console.error('MongoDB connection error:', err));

import authRoutes from './routes/auth.js';
import passRoutes from './routes/passes.js';
import scanRoutes from './routes/scans.js';

// Routes
app.get('/', (req, res) => {
  res.send('Bus Pass Verification System API is running...');
});

// Implementation required routes placeholder:
app.use('/api/auth', authRoutes);
app.use('/api/passes', passRoutes);
app.use('/api/scans', scanRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

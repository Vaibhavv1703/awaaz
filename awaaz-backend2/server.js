import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import audioRoutes from './routes/audioRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.warn("MONGO_URI is not defined in .env. Skipping MongoDB connection for now.");
            return;
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        console.warn('Server will continue running without MongoDB. Evaluate/Save features will not work.');
    }
};

connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/audio', audioRoutes);

app.get('/', (req, res) => {
    res.send('AWAAZ Node.js Backend is running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

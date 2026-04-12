import express from 'express';
import multer from 'multer';
import { transcribe, extract, evaluate, getApplications } from '../controllers/audioController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/transcribe', protect, upload.single('file'), transcribe);
router.post('/extract', protect, extract);
router.post('/evaluate', protect, evaluate);
router.get('/applications', protect, getApplications);

export default router;
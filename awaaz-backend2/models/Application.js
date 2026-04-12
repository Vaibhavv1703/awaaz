import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    transcript: {
        type: String,
    },
    accent_level: {
        type: String,
        default: 'Medium',
    },
    input_data: {
        type: Object, // The structured JSON data extracted from transcript
    },
    evaluation_result: {
        final_decision: String,
        biased_decision: String,
        bias_detected: Boolean,
        fairness_score: Number,
        message: String,
    }
}, { timestamps: true });

const Application = mongoose.model('Application', applicationSchema);
export default Application;
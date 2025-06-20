const { Schema, model } = require('mongoose');
const User = require('./User');
const { analyzeImageSafety } = require('../utils/gemini/ai_handlers');

const LocationReportSchema = new Schema({

    userID: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    imgUrl: {
        type: String,
        required: true,
        trim: true
    },
    coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        index: '2dsphere' // Enables geospatial queries
    },
    parameters: {

        crowdType: {
            type: String,
            enum: ['good', 'sketchy', 'risky'],
            required: true
        },
        lightingCondition: {
            type: String,
            enum: ['good', 'moderate', 'poor'],
            required: true
        },
        visibleSecurity: {
            type: Boolean,
            default: false
        }

    },
    isFeedbackProvided: {
        type: Boolean,
        default: false
    },
    feedbackFor: {
        type: Schema.Types.ObjectId,
        ref: 'LocationReport'
    },
    feedback: {
        type: String,
        enum: ['good', 'ok', 'not good', 'unsafe'],
        default: null
    },
    userType: {
        type: String,
        enum: ['he', 'she', 'other'],
        required: true
    },
    // ai controlled
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationResponses: {
        safetyLabel: {
            type: String,
            enum: ['safe', 'moderately risky', 'risky', 'unsafe'],
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        summary: {
            type: String,
            required: true
        },
        trustScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 50
        }
    }
}, {
    timestamps: true
});

LocationReportSchema.index({ coordinates: '2dsphere' });

LocationReportSchema.pre('save', async function (next) {

    if (!this.isNew) {
        return next(); // Skip if not a new document
    }

    // Additional logic before saving a new document can be added here

    const userData = await User.findById(this.userID);

    if (!userData) {
        return next(new Error('User not found'));
    }

    const aiFeedback = await analyzeImageSafety({
        imageUrl: this.imgUrl,
        userDescription: `the user is a ${this.userType} and the crowd is ${this.parameters.crowdType} with ${this.parameters.lightingCondition} lighting and visible security presence: ${this.parameters.visibleSecurity} if true that means the user is stating presense of cctv an secutity guards in the image they can be police officers also verify it and no need to describe it in the reply ${this.isFeedbackProvided ? `and the feedback is ${this.feedback}` : ''}`
    });

    if (aiFeedback) {

        this.isVerified = true;
        this.verificationResponses.safetyLabel = aiFeedback.safetyLabel;
        this.verificationResponses.summary = aiFeedback.summary;
        this.verificationResponses.trustScore = aiFeedback.trustScore;
        this.verificationResponses.timestamp = new Date();
        this.verificationResponses.userType = userData.gender;

    } else {

        this.isVerified = false;

    }

    next();

})

module.exports = model('LocationReport', LocationReportSchema);
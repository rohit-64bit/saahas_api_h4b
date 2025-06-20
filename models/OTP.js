const { Schema, model } = require('mongoose');

const OTPSchema = new Schema({

    userID: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        default: Date.now,
        expires: '5m' // OTP will expire after 5 minutes
    },
    isVerified: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});

// send_email -- this function will be used to send the OTP to the user via email

module.exports = model('OTP', OTPSchema);
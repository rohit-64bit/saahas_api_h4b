const { Schema, model } = require('mongoose');
const crypto = require('crypto');
const { verifyKycOtp } = require('../utils/kyc/aadhaar_handlers');

// Utility to hash Aadhaar
function hashAadhaarFingerprint(aadhaarNumber) {
    return crypto.createHash('sha256').update(aadhaarNumber).digest('hex');
}

const kycSchema = new Schema({
    userID: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    aadhaarHash: {
        type: String,
        required: true,
        unique: true,
    },
    otpVerified: {
        type: Boolean,
        default: false,
    },
    kycStatus: {
        type: String,
        enum: ['PENDING', 'VERIFIED', 'REJECTED'],
        default: 'PENDING',
    },
    decentroTxnId: {
        type: String,
    }
}, { timestamps: true });

// Optional virtual for debugging or temporary in-memory access
kycSchema.virtual('_aadhaarNumber').set(function (aadhaarNumber) {
    this.__aadhaarNumber = aadhaarNumber;
}).get(function () {
    return this.__aadhaarNumber;
});

kycSchema.methods.verifyOtp = async function (otp, decentroTxnId) {

    const User = require('./User');

    if (this.otpVerified) {
        throw new Error('OTP already verified');
    }

    // 1. Call Aadhaar OTP verification API
    const response = await verifyKycOtp(otp, decentroTxnId);

    const user = await User.findOneAndUpdate(this.userID, {
        isKYCCompleted: true,
        name: response.data.name,
        gender: response.data.gender,
        dob: response.data.dob
    }, {
        new: true
    });

    if (!user) {
        throw new Error('User not found');
    }

    // 2. Handle failed verification
    if (response.responseStatus !== 'SUCCESS') {

        this.kycStatus = 'REJECTED';
        await this.save();

        throw new Error(`OTP verification failed: ${response.message}`);

    }

    // 3. Save KYC verification status
    this.otpVerified = true;
    this.kycStatus = 'VERIFIED';
    await this.save();

    // 5. Return response
    return {
        success: true,
        message: 'KYC verified successfully',
        kycStatus: this.kycStatus,
    };

};


module.exports = model('KYC', kycSchema);
module.exports.hashAadhaarFingerprint = hashAadhaarFingerprint;
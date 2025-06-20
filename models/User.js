const { Schema, model } = require('mongoose');
const otpGenerator = require('otp-generator')
const ChatHistory = require('./ChatHistory');
const KYC = require('./KYC');
const OTP = require('./OTP');
const { JWTPayload, generateToken } = require('../utils/jwt_handlers');
const { generateKycOtp } = require('../utils/kyc/aadhaar_handlers');
const { hashAadhaarFingerprint } = require('./KYC');

const UserSchema = new Schema({

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    phoneNo: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    isAuthenticated: {
        type: Boolean,
        default: false
    },
    isKYCCompleted: {
        type: Boolean,
        default: false
    },
    kycDocID: {
        type: Schema.Types.ObjectId,
        ref: 'KYC',
        default: null
    },

    // Personal Information comning from aadhaar

    name: {
        type: String,
        trim: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other']
    },
    dob: {
        type: Date,
    }

}, {
    timestamps: true
});

UserSchema.pre('save', async function (next) {
    try {
        // 'this' refers to the document being saved
        if (this.isNew) {
            const otp = await this.generateOTP();
            if (!otp) {
                return next(new Error('Failed to generate OTP'));
            }

            // Generate chat history
            await ChatHistory.create({
                userId: this._id,
                messages: [
                    {
                        role: 'system',
                        content: `Welcome ! How can I assist you today?`,
                        timestamp: new Date()
                    }
                ]
            });
        }

        next(); // Call next when everything is okay

    } catch (err) {

        next(err); // Pass any error to next

    }
});

UserSchema.methods.generateOTP = async function () {

    const otp = otpGenerator.generate(6, { upperCaseAlphabets: true, specialChars: false, digits: true, lowerCaseAlphabets: false });

    const newOTP = {
        userID: this._id,
        otp: otp
    }

    const otpDoc = await OTP.create(newOTP);

    if (!otpDoc) {
        throw new Error('Failed to create OTP');
    }

    return otp;

}

UserSchema.methods.verifyOTP = async function (otp) {

    const otpDoc = await OTP.findOne({
        userID: this._id,
        otp: otp,
        isVerified: false
    });

    if (!otpDoc) {
        throw new Error('Invalid or expired OTP');
    }

    otpDoc.isVerified = true;
    await otpDoc.save();

    if (!this.isAuthenticated) {
        this.isAuthenticated = true;
        await this.save();
    }

    return true;

}

UserSchema.methods.generateAuthToken = async function () {

    const payload = new JWTPayload({
        userID: this._id,
        email: this.email,
        role: 'user',
        type: this.isKYCCompleted ? 'auth' : 'kyc'
    });

    const token = await generateToken(payload);

    return token;

}

UserSchema.methods.initiateKYC = async function (aadhaarNumber) {

    try {

        if (!this.isAuthenticated) {
            throw new Error('User is not authenticated');
        }

        if (this.isKYCCompleted) {
            throw new Error('KYC is already completed for this user');
        }

        const aadhaarHash = hashAadhaarFingerprint(aadhaarNumber);

        const existingKyc = await KYC.findOne({ aadhaarHash });

        if (existingKyc) {
            throw new Error('Aadhaar number already used for KYC');
        }

        const otpResponse = await generateKycOtp(aadhaarNumber);

        if (!otpResponse || otpResponse.responseKey !== 'success_otp_generated') {
            throw new Error('Failed to generate KYC OTP: ' + otpResponse?.message);
        }

        const kycDoc = new KYC({
            userID: this._id,
            aadhaarHash: aadhaarHash,
            decentroTxnId: otpResponse.decentroTxnId,
        });

        kycDoc._aadhaarNumber = aadhaarNumber;

        await kycDoc.save();

        return {
            success: true,
            message: 'KYC initiated successfully. OTP has been sent to the registered mobile number.',
        };

    } catch (error) {
        console.error('KYC Error:', error);
        throw new Error(error.message || 'Error initiating KYC');
    }

};

UserSchema.methods.verifyKYC = async function (otp) {

    try {

        if (!this.isAuthenticated) {
            throw new Error('User is not authenticated');
        }

        if (this.isKYCCompleted) {
            throw new Error('KYC is already completed for this user');
        }

        const kycDoc = await KYC.findOne({
            userID: this._id,
            otpVerified: false
        });

        if (!kycDoc) {
            throw new Error('KYC not initiated');
        }

        const kycResponse = await kycDoc.verifyOtp(otp, kycDoc.decentroTxnId);

        if (!kycResponse.success) {

            throw new Error(kycResponse.message || 'KYC verification failed');

        }

        return {
            success: true,
            message: kycResponse.message,
            kycStatus: kycResponse.kycStatus
        }

    } catch (error) {

        console.log('KYC Verification Error:', error);

        throw new Error('Error verifying KYC');

    }

}

module.exports = model('User', UserSchema);
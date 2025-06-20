const express = require('express');
const router = express.Router();
const User = require('../models/User');
const errorLooger = require('../utils/errorLooger');
const validateAuth = require('../middlewares/validateAuth');

router.post('/register', async (req, res) => {

    try {

        const { email, phoneNo } = req?.body;

        if (!email || !phoneNo) {
            return res.status(400).json({
                success: false,
                message: 'Email and phone number are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            email: email,
            phoneNo: phoneNo
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Create a new user
        const newUser = new User(req.body);
        await newUser.save();

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                userID: newUser._id,
                redirect_type: 'auth'
            }
        });

    } catch (error) {

        errorLooger(res, req, error);

    }

})

router.post('/login', async (req, res) => {

    try {

        const { email, phoneNo } = req.body;

        // Find user by email or phone number
        const user = await User.findOne({
            $or: [
                {
                    email: email
                },
                {
                    phoneNo: phoneNo
                }
            ]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate OTP
        const otp = await user.generateOTP();

        if (!otp) {
            return res.status(500).json({
                success: false,
                message: 'Failed to generate OTP'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'OTP sent successfully to your registered.',
            data: {
                userID: user._id,
                redirect_type: 'auth',
            }
        });

    } catch (error) {

        errorLooger(res, req, error);

    }

})

router.post('/verify-otp', async (req, res) => {

    try {

        const { userID, otp } = req.body;

        // Find user by ID
        const user = await User.findById(userID);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify OTP
        const isVerified = await user.verifyOTP(otp);

        if (!isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        const token = await user.generateAuthToken();

        return res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
            data: {
                userID: user._id,
                redirect_type: user.isKYCCompleted ? 'home' : 'new_kyc',
                token
            }
        });

    } catch (error) {

        errorLooger(res, req, error);

    }

})

router.get('/', validateAuth, async (req, res) => {

    try {

        const user = req.user;

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'User details fetched successfully',
            data: {
                userID: user._id,
                email: user.email,
                phoneNo: user.phoneNo,
                isKYCCompleted: user.isKYCCompleted,
                isAuthenticated: user.isAuthenticated
            }
        });

    } catch (error) {

        errorLooger(res, req, error);

    }

})

router.post('/kyc', validateAuth, async (req, res) => {

    try {

        const user = req.user;

        if (req.type !== 'kyc') {
            return res.status(400).json({
                success: false,
                message: 'Invalid request type for KYC initiation'
            });
        }

        const { aadhaarNumber } = req.body;

        if (!aadhaarNumber) {
            return res.status(400).json({
                success: false,
                message: 'Aadhaar number is missing'
            });
        }

        const intiate = await user.initiateKYC(aadhaarNumber);

        if (!intiate.success) {
            return res.status(400).json({
                success: false,
                message: intiate.message
            });
        }

        return res.status(200).json({
            success: true,
            message: 'OTP sent successfully to your linked mobile number.',
            data: {
                redirect_type: 'kyc_otp'
            }
        });

    } catch (error) {

        errorLooger(res, req, error);

    }

})

router.post('/kyc/verify', validateAuth, async (req, res) => {

    try {

        const user = req.user;

        if (req.type !== 'kyc') {
            return res.status(400).json({
                success: false,
                message: 'Invalid request type for KYC verification'
            });
        }

        const { otp } = req.body;

        if (!otp) {
            return res.status(400).json({
                success: false,
                message: 'OTP is required'
            });
        }

        const kycResponse = await user.verifyKYC(otp);

        return res.status(200).json({
            success: true,
            message: kycResponse.message,
            data: {
                userID: user._id,
                kycStatus: kycResponse.kycStatus
            }
        });

    } catch (error) {

        errorLooger(res, req, error);

    }

})

module.exports = router;
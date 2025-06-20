const crypto = require('crypto');

const api_config = {
    url: process.env.KYC_API_URL,
    headers: {
        'Content-Type': 'application/json',
        "client_id": process.env.KYC_CLIENT_ID,
        "client_secret": process.env.KYC_CLIENT_SECRET,
        "module_secret": process.env.KYC_MODULE_SECRET
    }
}

// this is working fine
const generateKycOtp = async (aadhaarNumber) => {

    const requestBody = {
        "reference_id": crypto.randomBytes(16).toString('hex'),
        "consent": true,
        "purpose": "for bank account verification",
        "aadhaar_number": aadhaarNumber
    }

    console.log(requestBody);

    const response = await fetch(api_config.url, {
        method: 'POST',
        headers: api_config.headers,
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`Failed to generate OTP: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.responseKey !== "success_otp_generated") {
        throw new Error(`Error generating OTP: ${data.message}`);
    }

    return {
        decentroTxnId: data.decentroTxnId,
        responseCode: data.responseCode,
        message: data.message,
        responseKey: data.responseKey
    };

}

// this is returning from throw new Error(`Failed to verify OTP: ${response.statusText}`);
const verifyKycOtp = async (otp, decentroTxnId) => {

    console.log(`Verifying OTP: ${otp} for transaction ID: ${decentroTxnId}`);

    const requestBody = {
        "reference_id": crypto.randomBytes(16).toString('hex'),
        "consent": true,
        "purpose": "for bank account verification",
        "initiation_transaction_id": decentroTxnId,
        "otp": otp,
        "share_code": "1111",
        "generate_pdf": false,
        "generate_xml": false
    }

    const response = await fetch(`${api_config.url}/validate`, {
        method: 'POST',
        headers: api_config.headers,
        body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (data.status !== "SUCCESS") {
        throw new Error(`Error verifying OTP: ${data.message}`);
    }

    return {
        decentroTxnId: data.decentroTxnId,
        responseStatus: data.status,
        message: data.message,
        data: {
            dob: data.data.proofOfIdentity.dob,
            gender: data.data.proofOfIdentity.gender,
            name: data.data.proofOfIdentity.name
        }
    };

}

module.exports = {
    generateKycOtp,
    verifyKycOtp
};
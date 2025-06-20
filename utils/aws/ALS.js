// utils/signTileUrl.js
const { SignatureV4 } = require('@aws-sdk/signature-v4');
const { Sha256 } = require('@aws-crypto/sha256-js'); // ✅ FIXED: Compatible SHA256 constructor
const { defaultProvider } = require('@aws-sdk/credential-provider-node');

const REGION = 'ap-south-1'; // Your AWS region
const MAP_NAME = 'SafetyMap'; // Replace with your actual map name

const signTileUrl = async (z, x, y) => {
    const tilePath = `/maps/v0/maps/${MAP_NAME}/tiles/${z}/${x}/${y}`;
    const hostname = `maps.geo.${REGION}.amazonaws.com`;

    const signer = new SignatureV4({
        credentials: defaultProvider(),
        region: REGION,
        service: 'geo',
        sha256: Sha256, // ✅ important for Node.js 20+
    });

    const signedRequest = await signer.presign(
        {
            method: 'GET',
            protocol: 'https:',
            hostname,
            path: tilePath,
            headers: {
                host: hostname,
            },
        },
        { signingDate: new Date() }
    );

    const url = `${signedRequest.protocol}//${signedRequest.hostname}${signedRequest.path}?${new URLSearchParams(signedRequest.query).toString()}`;

    return url;
};

module.exports = { signTileUrl };
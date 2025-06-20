const aws = require('aws-sdk');

const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

const handleSignUrl = (key) => {

    return new Promise((resolve, reject) => {
        const params = {
            Bucket: BUCKET_NAME,
            Key: key,
            Expires: 60 * 5 // URL valid for 5 minutes
        };

        s3.getSignedUrl('getObject', params, (err, url) => {
            if (err) {
                return reject(err);
            }
            resolve(url);
        });
    });

}


const express = require('express');
const router = express.Router();

const LocationReport = require('../models/LocationReport');
const errorLooger = require('../utils/errorLooger');
const validateAuth = require('../middlewares/validateAuth');

router.post('/', validateAuth, async (req, res) => {

    try {

        const { imgUrl, coordinates, parameters } = req.body;

        if (!imgUrl || !coordinates || !parameters) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const newReport = new LocationReport({
            userID: req.user._id,
            imgUrl,
            coordinates,
            parameters,
            isFeedbackProvided,
            feedbackFor,
            feedback
        });

        await newReport.save();

        return res.status(201).json({
            success: true,
            message: 'Location report submitted',
            data: newReport
        });

    } catch (error) {

        errorLooger(res, req, error);

    }

})

router.get('/', validateAuth, async (req, res) => {

    try {

        const { lat, lng } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ success: false, message: "Latitude and longitude required" });
        }

        const coordinates = [parseFloat(lng), parseFloat(lat)];

        const results = await LocationReport.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates },
                    distanceField: "distance",
                    spherical: true,
                    maxDistance: 30000, // 30km
                    query: { isVerified: true },
                    includeLocs: "location"
                }
            },
            {
                $group: {
                    _id: {
                        lat: { $round: [{ $arrayElemAt: ["$coordinates", 1] }, 3] },
                        lng: { $round: [{ $arrayElemAt: ["$coordinates", 0] }, 3] }
                    },
                    avgTrust: { $avg: "$verificationResponses.trustScore" },
                    count: { $sum: 1 },
                    reports: { $push: "$$ROOT" }
                }
            },
            {
                $project: {
                    _id: 0,
                    coordinates: {
                        lat: "$_id.lat",
                        lng: "$_id.lng"
                    },
                    avgTrust: 1,
                    count: 1,
                    safetyLabel: {
                        $cond: {
                            if: { $lte: ["$avgTrust", 30] },
                            then: "unsafe",
                            else: {
                                $cond: {
                                    if: { $lte: ["$avgTrust", 60] },
                                    then: "moderately risky",
                                    else: "safe"
                                }
                            }
                        }
                    }
                }
            }
        ]);

        res.json({ success: true, zones: results });

    } catch (error) {

        errorLooger(res, req, error);

    }

})

module.exports = router;
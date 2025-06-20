const express = require('express');
const errorLooger = require('../utils/errorLooger');
const { signTileUrl } = require('../utils/aws/ALS');
const router = express.Router();

router.get('/map/tiles/:z/:x/:y', async (req, res) => {

    const { z, x, y } = req.params;

    try {

        const url = await signTileUrl(z, x, y);

        res.json({ url });

    } catch (err) {

        errorLooger(res, req, err);

    }

});

module.exports = router;
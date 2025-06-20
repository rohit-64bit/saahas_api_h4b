const Admin = require("../models/Admin");
const User = require("../models/User");
const { verifyDecodeToken } = require("../utils/jwt_handlers");

const validateAuth = async (req, res, next) => {

    const token = req.header('token');

    const token_parts = token ? token.split(' ') : [];

    if (token_parts.length !== 2 || token_parts[0] !== 'Authorization') {
        return res.status(401).json({
            success: false,
            message: 'Invalid or missing token'
        });
    }

    const payload = await verifyDecodeToken(token_parts[1]);

    if (!payload) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }

    if (payload.role === 'admin') {

        const validateAdmin = await Admin.findById(payload.userID);

        if (!validateAdmin) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        req.admin = validateAdmin;

        next();

    } else if (payload.role === 'user') {

        const validateUser = await User.findById(payload.userID);

        if (!validateUser) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        req.user = validateUser;
        req.type = payload.type;

        next();

    } else {

        return res.status(401).json({
            success: false,
            message: 'Unauthorized access'
        });

    }

}

module.exports = validateAuth;
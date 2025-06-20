const jwt = require('jsonwebtoken');

class JWTPayload {
    constructor({ userID, email, role, type }) {
        this.userID = userID;
        this.email = email;
        this.role = role;
        this.type = type;
    }
}

const generateToken = async (payload) => {

    return jwt.sign({ ...payload }, process.env.JWT_SECRET);

};

const verifyDecodeToken = async (token) => {

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;

    } catch (error) {
        throw new Error('Invalid token');
    }

};

module.exports = {
    generateToken,
    verifyDecodeToken,
    JWTPayload
};
const requireAdmin = (req, res, next) => {

    if (!req.admin) {

        return res.status(403).json({
            success: false,
            message: 'Access restricted to admins only'
        });

    }

    next();

};

module.exports = requireAdmin;
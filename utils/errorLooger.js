const errorLooger = (res, req, error) => {

    console.error(error.message);

    // Send a response to the client
    return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: error.message
    });

}

module.exports = errorLooger;
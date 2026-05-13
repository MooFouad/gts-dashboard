const mongoose = require('mongoose');

const dbHealthCheck = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database temporarily unavailable. Please try again in a few moments.',
      code: 'DB_UNAVAILABLE',
      retryAfter: 10
    });
  }
  next();
};

module.exports = dbHealthCheck;

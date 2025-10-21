const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('./errorHandler');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('No token provided. Please login.', 401));
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Handle guest users
    if (decoded.isGuest) {
      req.user = {
        _id: 'guest-user',
        id: 'guest-user',
        email: 'guest@demo.com',
        name: 'Guest User',
        role: 'guest',
        isGuest: true,
        isActive: true
      };
      return next();
    }

    // Check if regular user still exists
    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(new AppError('User no longer exists.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('User account is deactivated.', 401));
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please login again.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired. Please login again.', 401));
    }
    next(error);
  }
};

// Check user roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};

// Middleware to block guest users from write operations
const blockGuestWrites = (req, res, next) => {
  if (req.user && req.user.isGuest) {
    const method = req.method.toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next(new AppError('Guest users cannot modify data. Please create an account or contact an administrator.', 403));
    }
  }
  next();
};

module.exports = {
  authenticate,
  authorize,
  blockGuestWrites
};
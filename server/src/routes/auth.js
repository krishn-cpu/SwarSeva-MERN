const express = require('express');
const router = express.Router();

// Import controller methods
const {
  register,
  login,
  logout,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  updatePassword,
  updateDetails,
  verifyEmail,
  deactivateAccount
} = require('../controllers/auth');

// Import middleware
const { protect, authorize, authRateLimiter, registerRateLimiter, passwordResetLimiter } = require('../middleware/auth');

// Public routes
router.post('/register', registerRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/forgotpassword', passwordResetLimiter, forgotPassword);
router.put('/resetpassword/:resettoken', passwordResetLimiter, resetPassword);
router.get('/verifyemail/:token', verifyEmail);

// Protected routes (require authentication)
router.use(protect); // Apply protection middleware to all routes below
router.get('/logout', logout);
router.get('/me', getCurrentUser);
router.put('/updatedetails', updateDetails);
router.put('/updatepassword', updatePassword);
router.put('/deactivate', deactivateAccount);

// Admin only routes can be added here if needed
// Example: router.get('/admin/users', authorize('admin'), getAllUsers);

module.exports = router;

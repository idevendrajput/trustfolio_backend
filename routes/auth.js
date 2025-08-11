const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { 
  authenticate, 
  authorize,
  requireRole,
  generateToken, 
  generateRefreshToken 
} = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Admin login
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find admin by email (with password field included)
    const admin = await Admin.findByEmail(email).select('+password +loginAttempts +lockUntil');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (admin.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to too many failed login attempts. Please try again later.'
      });
    }

    // Check if account is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.'
      });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      // Increment login attempts
      await admin.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts on successful login
    await admin.resetLoginAttempts();

    // Generate tokens
    const token = generateToken(admin._id);
    const refreshToken = generateRefreshToken(admin._id);

    // Remove sensitive fields from response
    admin.password = undefined;
    admin.loginAttempts = undefined;
    admin.lockUntil = undefined;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        admin: admin.toJSON(),
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
      
      if (decoded.type !== 'refresh') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token type'
        });
      }

      const admin = await Admin.findById(decoded.adminId);
      
      if (!admin || !admin.isActive || admin.isLocked) {
        return res.status(401).json({
          success: false,
          message: 'Admin account not valid'
        });
      }

      // Generate new access token
      const newToken = generateToken(admin._id);

      res.json({
        success: true,
        data: {
          token: newToken
        }
      });

    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
});

/**
 * @route   GET /api/auth/profile
 * @desc    Get current admin profile
 * @access  Private
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id)
      .select('-password -loginAttempts -lockUntil')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    res.json({
      success: true,
      data: {
        admin: admin
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current admin profile
 * @access  Private
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, email } = req.body;
    const allowedUpdates = {};

    if (name) allowedUpdates.name = name;
    if (email) {
      // Check if email is already taken by another admin
      const existingAdmin = await Admin.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: req.admin._id } 
      });
      
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another admin'
        });
      }
      
      allowedUpdates.email = email.toLowerCase();
    }

    allowedUpdates.updatedBy = req.admin._id;

    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.admin._id,
      allowedUpdates,
      { new: true, runValidators: true }
    ).select('-password -loginAttempts -lockUntil');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        admin: updatedAdmin
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change current admin password
 * @access  Private
 */
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get admin with current password
    const admin = await Admin.findById(req.admin._id).select('+password');

    // Verify current password
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    admin.password = newPassword;
    admin.updatedBy = req.admin._id;
    await admin.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout admin (client-side token removal)
 * @access  Private
 */
router.post('/logout', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token validity
 * @access  Private
 */
router.get('/verify', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      admin: req.admin
    }
  });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current admin (alias for profile)
 * @access  Private
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id)
      .select('-password -loginAttempts -lockUntil');

    res.json({
      success: true,
      data: admin
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

module.exports = router;

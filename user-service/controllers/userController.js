import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer, { getTestMessageUrl } from 'nodemailer';
import User from '../models/User.js';
import Address from '../models/Address.js';
import TokenService from '../services/tokenService.js';
import { Op } from 'sequelize';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const OTP_EXPIRY_MINUTES = 10;

// Setup nodemailer transporter (for demo, using ethereal)
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: process.env.ETHEREAL_USER || 'o4zsepi63j4ttpo3@ethereal.email',
    pass: process.env.ETHEREAL_PASS || 'fAKq5FKJ3hsP1WENqh',
  },
});

const sendVerificationEmail = async (email, otp) => {
  const info = await transporter.sendMail({
    from: 'o4zsepi63j4ttpo3@ethereal.email',
    to: email,
    subject: 'Verify your MicroMart account',
    text: `Your verification code is: ${otp}`,
    html: `<h2>Verify your MicroMart account</h2><p>Your verification code is: <b>${otp}</b></p>`,
  });
  console.log('Verification email sent:', info.messageId);
  console.log('Preview URL:', getTestMessageUrl(info));
};

// Email validation regex
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Password validation: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const validateEmail = (email) => {
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return passwordRegex.test(password);
};

export const register = async (req, res) => {
  try {
    const { email, password, name, role = 'buyer' } = req.body;

    console.log(`🔐 Registration attempt for email: ${email}, name: ${name}, role: ${role}`);

    // Validate email format
    if (!validateEmail(email)) {
      console.log(`❌ Registration failed - Invalid email format: ${email}`);
      return res.status(400).json({ 
        message: 'Invalid email format. Please provide a valid email address.' 
      });
    }

    // Validate password strength
    if (!validatePassword(password)) {
      console.log(`❌ Registration failed - Weak password for: ${email}`);
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).' 
      });
    }

    // Validate role
    if (!['buyer', 'seller'].includes(role)) {
      console.log(`❌ Registration failed - Invalid role: ${role}`);
      return res.status(400).json({ 
        message: 'Invalid role. Role must be either "buyer" or "seller".' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log(`❌ Registration failed - User already exists: ${email}`);
      return res.status(400).json({ message: 'User already exists with this email address.' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Create user with email verification token
    const user = await User.create({
      email,
      password, // Will be hashed by the model hook
      name,
      role,
      isEmailVerified: false,
      emailVerificationToken: otp,
      emailVerificationExpiry: otpExpiry,
      profile: {},
      oauthProviders: []
    });

    console.log(`✅ User created successfully: ${user.id}`);

    // Send verification email
    try {
      await sendVerificationEmail(email, otp);
      console.log(`📧 Verification email sent to: ${email}`);
    } catch (emailError) {
      console.log(`⚠️ Failed to send verification email:`, emailError.message);
      // Don't fail registration if email fails
    }

    res.status(201).json({ 
      message: 'Registration successful. Please check your email for verification code.',
      userId: user.id,
      email: user.email
    });

  } catch (error) {
    console.error(`❌ Registration error:`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log(`🔐 Email verification attempt for: ${email}`);

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log(`❌ Email verification failed - User not found: ${email}`);
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      console.log(`✅ Email already verified for: ${email}`);
      return res.json({ message: 'Email already verified.' });
    }

    // Check OTP and expiry
    if (user.emailVerificationToken !== otp) {
      console.log(`❌ Email verification failed - Invalid OTP for: ${email}`);
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    if (new Date() > user.emailVerificationExpiry) {
      console.log(`❌ Email verification failed - OTP expired for: ${email}`);
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    // Mark email as verified
    await user.update({
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiry: null
    });

    console.log(`✅ Email verified successfully for: ${email}`);

    res.json({ message: 'Email verified successfully. You can now login.' });

  } catch (error) {
    console.error(`❌ Email verification error:`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    console.log(`🔐 Resend OTP request for: ${email}`);

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log(`❌ Resend OTP failed - User not found: ${email}`);
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      console.log(`✅ Email already verified for: ${email}`);
      return res.json({ message: 'Email already verified.' });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Update user with new OTP
    await user.update({
      emailVerificationToken: otp,
      emailVerificationExpiry: otpExpiry
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, otp);
      console.log(`📧 New verification email sent to: ${email}`);
    } catch (emailError) {
      console.log(`⚠️ Failed to send verification email:`, emailError.message);
      return res.status(500).json({ message: 'Failed to send verification email.' });
    }

    res.json({ message: 'New verification code sent to your email.' });

  } catch (error) {
    console.error(`❌ Resend OTP error:`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`🔐 Login attempt for email: ${email}`);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find user by email
    const user = await User.findOne({ where: { email, isActive: true } });
    if (!user) {
      console.log(`❌ Login failed - User not found: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      console.log(`❌ Login failed - Email not verified: ${email}`);
      return res.status(401).json({ 
        message: 'Please verify your email before logging in.',
        needsVerification: true 
      });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      console.log(`❌ Login failed - Invalid password for: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    // Get client info for token storage
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Generate access and refresh tokens
    const accessToken = await TokenService.generateToken(user, 'access', userAgent, ipAddress);
    const refreshToken = await TokenService.generateToken(user, 'refresh', userAgent, ipAddress);

    console.log(`✅ Login successful for: ${email}`);

    res.json({
      message: 'Login successful',
      accessToken: accessToken.token,
      refreshToken: refreshToken.token,
      expiresAt: accessToken.expiresAt,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error(`❌ Login error:`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(400).json({ message: 'No token provided.' });
    }

    const revoked = await TokenService.revokeToken(token);
    
    if (revoked) {
      console.log(`🔐 User logged out successfully`);
      res.json({ message: 'Logged out successfully.' });
    } else {
      res.status(400).json({ message: 'Invalid token.' });
    }

  } catch (error) {
    console.error(`❌ Logout error:`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required.' });
    }

    const result = await TokenService.refreshAccessToken(refreshToken);

    if (result.success) {
      res.json({
        message: 'Token refreshed successfully',
        accessToken: result.accessToken,
        expiresAt: result.expiresAt
      });
    } else {
      res.status(401).json({ message: 'Invalid refresh token.' });
    }

  } catch (error) {
    console.error(`❌ Token refresh error:`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log(`👤 Profile request for user: ${userId}`);

    const user = await User.findByPk(userId, {
      include: [
        {
          model: Address,
          as: 'addresses',
          attributes: ['id', 'type', 'isDefault', 'street', 'city', 'state', 'zipCode', 'country', 'phone', 'label']
        }
      ]
    });

    if (!user) {
      console.log(`❌ Profile not found for user: ${userId}`);
      return res.status(404).json({ message: 'User not found.' });
    }

    console.log(`✅ Profile retrieved for user: ${userId}`);

    res.json({
      user: user.getPublicProfile(),
      addresses: user.addresses || []
    });

  } catch (error) {
    console.error(`❌ Get profile error:`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    console.log(`👥 All users request`);

    const users = await User.findAll({
      where: { isActive: true },
      attributes: ['id', 'email', 'name', 'role', 'isEmailVerified', 'lastLoginAt', 'createdAt']
    });

    console.log(`✅ Retrieved ${users.length} users`);

    res.json({ users });

  } catch (error) {
    console.error(`❌ Get all users error:`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAddresses = async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log(`📍 Addresses request for user: ${userId}`);

    const addresses = await Address.findAll({
      where: { userId },
      order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
    });

    console.log(`✅ Retrieved ${addresses.length} addresses for user: ${userId}`);

    res.json({ addresses });

  } catch (error) {
    console.error(`❌ Get addresses error:`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const addAddress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, street, city, state, zipCode, country, phone, label } = req.body;

    console.log(`📍 Adding address for user: ${userId}`);

    if (!street || !city || !state || !zipCode) {
      return res.status(400).json({ message: 'Street, city, state, and zip code are required.' });
    }

    const address = await Address.create({
      userId,
      type: type || 'home',
      street,
      city,
      state,
      zipCode,
      country: country || 'India',
      phone,
      label
    });

    console.log(`✅ Address added successfully: ${address.id}`);

    res.status(201).json({ 
      message: 'Address added successfully',
      address 
    });

  } catch (error) {
    console.error(`❌ Add address error:`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const updateData = req.body;

    console.log(`📍 Updating address ${id} for user: ${userId}`);

    const address = await Address.findOne({
      where: { id, userId }
    });

    if (!address) {
      console.log(`❌ Address not found: ${id}`);
      return res.status(404).json({ message: 'Address not found.' });
    }

    await address.update(updateData);

    console.log(`✅ Address updated successfully: ${id}`);

    res.json({ 
      message: 'Address updated successfully',
      address 
    });

  } catch (error) {
    console.error(`❌ Update address error:`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    console.log(`📍 Deleting address ${id} for user: ${userId}`);

    const address = await Address.findOne({
      where: { id, userId }
    });

    if (!address) {
      console.log(`❌ Address not found: ${id}`);
      return res.status(404).json({ message: 'Address not found.' });
    }

    await address.destroy();

    console.log(`✅ Address deleted successfully: ${id}`);

    res.json({ message: 'Address deleted successfully' });

  } catch (error) {
    console.error(`❌ Delete address error:`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const findOrCreateOAuthUser = async ({ email, name, provider, providerId }) => {
  try {
    console.log(`🔐 OAuth user lookup: ${email} (${provider})`);

    // Find existing user
    let user = await User.findOne({ where: { email } });

    if (user) {
      // Update OAuth provider info
      const oauthProviders = user.oauthProviders || [];
      const existingProvider = oauthProviders.find(p => p.provider === provider);
      
      if (!existingProvider) {
        oauthProviders.push({ provider, providerId });
        await user.update({ 
          oauthProviders,
          isEmailVerified: true, // OAuth users are pre-verified
          lastLoginAt: new Date()
        });
      }

      console.log(`✅ Existing OAuth user found: ${user.id}`);
      return user;
    }

    // Create new OAuth user
    user = await User.create({
      email,
      name,
      password: await bcrypt.hash(Math.random().toString(36), 12), // Random password for OAuth users
      role: 'buyer',
      isEmailVerified: true, // OAuth users are pre-verified
      oauthProviders: [{ provider, providerId }],
      profile: {},
      lastLoginAt: new Date()
    });

    console.log(`✅ New OAuth user created: ${user.id}`);
    return user;

  } catch (error) {
    console.error(`❌ OAuth user creation error:`, error);
    throw error;
  }
};
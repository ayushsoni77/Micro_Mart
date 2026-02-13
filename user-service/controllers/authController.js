import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer, { getTestMessageUrl } from 'nodemailer';
import User from '../models/User.js';
import Buyer from '../models/Buyer.js';
import Seller from '../models/Seller.js';
import Role from '../models/Role.js';
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

    // Create user in canonical users table
    const user = await User.create({
      email,
      password, // Will be hashed by the model hook
      name,
      isEmailVerified: true, // Auto-verify for development
      emailVerificationToken: otp,
      emailVerificationExpiry: otpExpiry,
      profile: {},
      oauthProviders: []
    });

    // Get the role ID
    const roleRecord = await Role.findOne({ where: { name: role } });
    if (roleRecord) {
      // Assign role to user
      await user.addRole(roleRecord);
    }

    // Create profile extension (Buyer or Seller)
    if (role === 'buyer') {
      await Buyer.create({ userId: user.id });
    } else if (role === 'seller') {
      await Seller.create({ userId: user.id });
    }

    // Try to send verification email (don't fail if it doesn't work)
    try {
      await sendVerificationEmail(email, otp);
    } catch (emailError) {
      console.warn(`⚠️ Warning: Failed to send verification email: ${emailError.message}`);
      // Don't fail registration if email fails
    }

    console.log(`✅ Registration successful for: ${email}`);
    res.status(201).json({
      message: 'Registration successful. Please check your email for verification code.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: role,
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`🔐 Login attempt for email: ${email}`);

    // Find user in canonical users table
    const user = await User.findOne({ 
      where: { email },
      include: [
        { model: Role, as: 'roles', through: { attributes: [] } },
        { model: Buyer, as: 'buyerProfile' },
        { model: Seller, as: 'sellerProfile' }
      ]
    });

    if (!user) {
      console.log(`❌ Login failed - User not found: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    console.log(`✅ Found user: ${user.email}`);

    // Check if email is verified
    if (!user.isEmailVerified) {
      console.log(`❌ Login failed - Email not verified: ${email}`);
      return res.status(401).json({ 
        message: 'Please verify your email address before logging in.',
        needsVerification: true 
      });
    }

    console.log(`✅ Email verified: ${user.isEmailVerified}`);

    // Check if account is active
    if (!user.isActive) {
      console.log(`❌ Login failed - Account inactive: ${email}`);
      return res.status(401).json({ message: 'Account is deactivated. Please contact support.' });
    }

    console.log(`✅ Account active check passed`);

    // Verify password
    console.log(`🔐 Verifying password...`);
    const isPasswordValid = await user.comparePassword(password);
    console.log(`   Password valid: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      console.log(`❌ Login failed - Invalid password for: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    console.log(`✅ Password verified`);

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    console.log(`✅ Last login updated`);

    // Determine user role from roles array
    const userRole = user.roles && user.roles.length > 0 ? user.roles[0].name : 'buyer';

    // Generate tokens
    const accessToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: userRole, 
        type: 'access' 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: userRole, 
        type: 'refresh' 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ Tokens generated`);

    // Store refresh token
    await TokenService.storeToken(user.id, refreshToken, 'refresh');

    console.log(`✅ Refresh token stored`);

    console.log(`✅ Login successful for: ${email}`);
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: userRole,
        isEmailVerified: user.isEmailVerified
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const { userId, role } = req.user;

    // Get user from canonical users table with role and profile associations
    const user = await User.findByPk(userId, {
      include: [
        { model: Role, as: 'roles', through: { attributes: [] } },
        { model: Buyer, as: 'buyerProfile' },
        { model: Seller, as: 'sellerProfile' }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Return user profile with associated role and profile data
    const publicProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.roles && user.roles.length > 0 ? user.roles[0].name : 'buyer',
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      buyerProfile: user.buyerProfile || null,
      sellerProfile: user.sellerProfile || null
    };

    res.json({ user: publicProfile });

  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile.' });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find user in canonical users table
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified.' });
    }

    if (user.emailVerificationToken !== otp) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    if (user.emailVerificationExpiry < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired.' });
    }

    // Verify email
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpiry = null;
    await user.save();

    console.log(`✅ Email verified for: ${email}`);
    res.json({ message: 'Email verified successfully.' });

  } catch (error) {
    console.error('❌ Email verification error:', error);
    res.status(500).json({ message: 'Email verification failed.' });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token is required.' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid token type.' });
    }

    // Check if token exists in database
    const tokenExists = await TokenService.verifyToken(decoded.userId, refreshToken, 'refresh');
    if (!tokenExists) {
      return res.status(401).json({ message: 'Invalid refresh token.' });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { 
        userId: decoded.userId, 
        email: decoded.email, 
        role: decoded.role, 
        type: 'access' 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ accessToken });

  } catch (error) {
    console.error('❌ Token refresh error:', error);
    res.status(401).json({ message: 'Invalid refresh token.' });
  }
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const { userId } = req.user;

    if (refreshToken) {
      await TokenService.removeToken(userId, refreshToken, 'refresh');
    }

    res.json({ message: 'Logout successful.' });

  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ message: 'Logout failed.' });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user in canonical users table
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified.' });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Update user with new OTP
    user.emailVerificationToken = otp;
    user.emailVerificationExpiry = otpExpiry;
    await user.save();

    // Send new verification email
    await sendVerificationEmail(email, otp);

    console.log(`✅ OTP resent for: ${email}`);
    res.json({ message: 'Verification code resent successfully.' });

  } catch (error) {
    console.error('❌ OTP resend error:', error);
    res.status(500).json({ message: 'Failed to resend verification code.' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const buyers = await Buyer.findAll({
      attributes: ['id', 'email', 'name', 'isEmailVerified', 'createdAt']
    });
    
    const sellers = await Seller.findAll({
      attributes: ['id', 'email', 'name', 'isEmailVerified', 'businessName', 'isVerified', 'createdAt']
    });

    res.json({
      buyers: buyers.map(b => ({ ...b.toJSON(), role: 'buyer' })),
      sellers: sellers.map(s => ({ ...s.toJSON(), role: 'seller' }))
    });

  } catch (error) {
    console.error('❌ Get all users error:', error);
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
};

export const getAddresses = async (req, res) => {
  try {
    const { userId } = req.user;
    
    // Check if user exists in either table
    let user = await Buyer.findByPk(userId);
    let userRole = 'buyer';
    
    if (!user) {
      user = await Seller.findByPk(userId);
      userRole = 'seller';
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const addresses = await Address.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    res.json(addresses);

  } catch (error) {
    console.error('❌ Get addresses error:', error);
    res.status(500).json({ message: 'Failed to fetch addresses.' });
  }
};

export const addAddress = async (req, res) => {
  try {
    const { userId } = req.user;
    const { type, street, city, state, zipCode, country, isDefault } = req.body;

    // Check if user exists in either table
    let user = await Buyer.findByPk(userId);
    let userRole = 'buyer';
    
    if (!user) {
      user = await Seller.findByPk(userId);
      userRole = 'seller';
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // If this is a default address, unset other defaults
    if (isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId, isDefault: true } }
      );
    }

    const address = await Address.create({
      userId,
      type,
      street,
      city,
      state,
      zipCode,
      country,
      isDefault: isDefault || false
    });

    res.status(201).json(address);

  } catch (error) {
    console.error('❌ Add address error:', error);
    res.status(500).json({ message: 'Failed to add address.' });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const { type, street, city, state, zipCode, country, isDefault } = req.body;

    // Check if user exists in either table
    let user = await Buyer.findByPk(userId);
    let userRole = 'buyer';
    
    if (!user) {
      user = await Seller.findByPk(userId);
      userRole = 'seller';
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const address = await Address.findOne({
      where: { id, userId }
    });

    if (!address) {
      return res.status(404).json({ message: 'Address not found.' });
    }

    // If this is a default address, unset other defaults
    if (isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId, isDefault: true, id: { [Op.ne]: id } } }
      );
    }

    await address.update({
      type,
      street,
      city,
      state,
      zipCode,
      country,
      isDefault: isDefault || false
    });

    res.json(address);

  } catch (error) {
    console.error('❌ Update address error:', error);
    res.status(500).json({ message: 'Failed to update address.' });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    // Check if user exists in either table
    let user = await Buyer.findByPk(userId);
    let userRole = 'buyer';
    
    if (!user) {
      user = await Seller.findByPk(userId);
      userRole = 'seller';
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const address = await Address.findOne({
      where: { id, userId }
    });

    if (!address) {
      return res.status(404).json({ message: 'Address not found.' });
    }

    await address.destroy();

    res.json({ message: 'Address deleted successfully.' });

  } catch (error) {
    console.error('❌ Delete address error:', error);
    res.status(500).json({ message: 'Failed to delete address.' });
  }
}; 
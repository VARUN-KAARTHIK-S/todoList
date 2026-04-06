const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

// Standard sign token function
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_secret_key', {
    expiresIn: '7d',
  });
};

// Validation Schemas (Joi)
const registerSchema = Joi.object({
  username: Joi.string().min(3).required(),
  password: Joi.string().min(6).required(),
  year: Joi.number().required(),
  Department: Joi.string().required(),
  email: Joi.string().email().required(),
  Age: Joi.number().min(1).required()
}).unknown(true); // Ignore extra fields from the client to avoid 400s


const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const updateSchema = Joi.object({
  username: Joi.string().min(3),
  year: Joi.number(),
  Department: Joi.string(),
  Age: Joi.number().min(1)
});

// @desc    Register a new user
// @route   POST /api/users/register
exports.registerUser = async (req, res) => {
  try {
    console.log('Incoming registration request:', req.body);
    const { error } = registerSchema.validate(req.body);
    if (error) {
        console.log('Joi Validation Error:', error.details[0].message);
        // We will CONTINUE for now to see if the database accepts it, or just return.
        // Let's RETURN but with a better message.
        return res.status(400).json({ 
          message: `Validation failed: ${error.details[0].message}`,
          details: error.details[0]
        });
    }

    const { email, username } = req.body;
    
    // Check for duplicate email
    const emailExists = await User.findOne({ email });
    if (emailExists) return res.status(400).json({ message: 'Email is already being used.' });

    // Check for duplicate username
    const usernameExists = await User.findOne({ username });
    if (usernameExists) return res.status(400).json({ message: 'Username is already taken.' });

    const user = await User.create(req.body);
    const token = signToken(user._id);

    // Keep cookie for backward compatibility if needed, but client now uses Bearer
    res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      status: 'success',
      token,
      data: { user }
    });
  } catch (err) {
    console.log('Full Registration error:', err);
    res.status(400).json({ 
      message: 'Database error: ' + err.message,
      errorName: err.name,
      field: err.errors ? Object.keys(err.errors)[0] : 'unknown'
    });
  }
};

// @desc    Login user
// @route   POST /api/users/login
exports.loginUser = async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    const token = signToken(user._id);
    
    // Set HTTP-only cookie for secure session management
    res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      status: 'success',
      token,
      data: { user }
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/users/getuser
exports.getUser = async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: { user: req.user }
  });
};

// @desc    Update user profile
// @route   PATCH /api/users/updateuser
exports.updateUser = async (req, res) => {
  try {
    const { error } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const updatedUser = await User.findByIdAndUpdate(req.user._id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      data: { user: updatedUser }
    });
  } catch (err) {
    console.log('Update error:', err);
    console.log('Request body at error:', req.body);
    res.status(400).json({ 
      message: err.message,
      details: err.errors
    });
  }
};

// @desc    Logout user — clears the HTTP-only cookie
// @route   POST /api/users/logout
exports.logoutUser = (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
  res.status(200).json({ status: 'success', message: 'Logged out successfully.' });
};

// @desc    Server Status
exports.getStatus = (req, res) => {
    res.status(200).json({
        status: 'online',
        timestamp: new Date().toISOString(),
        message: 'Auth server is up and running'
    });
};

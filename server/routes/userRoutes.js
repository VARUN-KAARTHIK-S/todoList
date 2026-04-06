const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/logout', userController.logoutUser); // Clears the HTTP-only cookie
router.get('/status', userController.getStatus);

// Protected routes (require valid JWT)
router.get('/getuser', authMiddleware, userController.getUser);
router.patch('/updateuser', authMiddleware, userController.updateUser);

module.exports = router;

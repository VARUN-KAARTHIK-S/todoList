const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const todoRoutes = require('./routes/todoRoutes'); // Existing todos
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (origin.indexOf('localhost') !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser()); // Enables reading of cookies (for JWT)

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/todolist')
  .then(() => console.log('Connected to MongoDB!'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/users', userRoutes);

// Protect todo routes if needed (standard practice)
// This will require user to be logged in to manage tasks
app.use('/api/todos', authMiddleware, todoRoutes);

app.get('/', (req, res) => {
  res.send('Todo List Auth API is running...');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

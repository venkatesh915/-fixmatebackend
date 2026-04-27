const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const authRoutes = require('./routes/auth');
const workerRoutes = require('./routes/workers');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/', (req, res) => {
    res.send('FixMate API is running perfectly!');
});
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`FixMate Backend running on port ${PORT}`);
});

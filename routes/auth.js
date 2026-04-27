const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = 'fixmate-super-secret-key';
const otpStore = {}; // Memory store for Mock OTPs: { phone: "1234" }

// Send OTP
router.post('/send-otp', (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });

    // In a real app, integrate Twilio/SNS here
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore[phone] = otp;
    
    // Simulating SMS by logging to console
    console.log(`[SMS SENDER] Sending OTP ${otp} to phone ${phone}`);
    
    res.json({ message: 'OTP sent successfully', _mock_otp: otp }); // returning mock otp for testing ease
});

// Verify OTP
router.post('/verify', (req, res) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });

    if (otpStore[phone] === otp) {
        delete otpStore[phone]; // OTP used

        // Upsert user
        db.get('SELECT id FROM users WHERE phone = ?', [phone], (err, row) => {
            if (err) return res.status(500).json({ error: 'Database error' });

            if (row) {
                const token = jwt.sign({ id: row.id, phone }, JWT_SECRET, { expiresIn: '7d' });
                res.json({ token, user: { id: row.id, phone } });
            } else {
                db.run('INSERT INTO users (phone) VALUES (?)', [phone], function(err) {
                    if (err) return res.status(500).json({ error: 'Could not create user' });
                    const token = jwt.sign({ id: this.lastID, phone }, JWT_SECRET, { expiresIn: '7d' });
                    res.json({ token, user: { id: this.lastID, phone } });
                });
            }
        });
    } else {
        res.status(401).json({ error: 'Invalid or expired OTP' });
    }
});

module.exports = router;

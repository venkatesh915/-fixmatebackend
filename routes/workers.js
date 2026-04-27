const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Register Worker (with images)
router.post('/register', upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'shopImage', maxCount: 1 }
]), (req, res) => {
    const { name, phone, serviceType, latitude, longitude, experienceYears } = req.body;
    
    if (!name || !phone || !serviceType || !latitude || !longitude) {
        return res.status(400).json({ error: 'Missing required worker fields' });
    }

    const profileImage = req.files['profileImage'] ? `/uploads/${req.files['profileImage'][0].filename}` : '';
    const shopImage = req.files['shopImage'] ? `/uploads/${req.files['shopImage'][0].filename}` : '';

    const sql = `INSERT INTO workers 
        (name, phone, service_type, latitude, longitude, profile_image, shop_image, experience_years) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [
        name, phone, serviceType, parseFloat(latitude), parseFloat(longitude), 
        profileImage, shopImage, parseInt(experienceYears) || 0
    ], function(err) {
        if (err) {
            console.error(err);
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'Phone number already registered' });
            }
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Worker registered successfully', workerId: this.lastID });
    });
});

// Get Nearby Workers
// Simple mock distance implementation - in reality you'd use PostGIS or Haversine formula here
router.get('/', (req, res) => {
    const { lat, lng, serviceType } = req.query;

    let sql = 'SELECT * FROM workers';
    let params = [];

    if (serviceType) {
        sql += ' WHERE service_type = ?';
        params.push(serviceType);
    }
    
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        // Calculate rough distance using Haversine if lat/lng provided
        if (lat && lng) {
            const userLat = parseFloat(lat);
            const userLng = parseFloat(lng);
            rows.forEach(w => {
                const dLat = (w.latitude - userLat) * Math.PI / 180;
                const dLng = (w.longitude - userLng) * Math.PI / 180;
                const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                          Math.cos(userLat * Math.PI / 180) * Math.cos(w.latitude * Math.PI / 180) *
                          Math.sin(dLng/2) * Math.sin(dLng/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                w.distanceKm = (6371 * c).toFixed(1); // Radius of earth in km
            });
            // Sort by distance
            rows.sort((a, b) => parseFloat(a.distanceKm) - parseFloat(b.distanceKm));
        }
        res.json(rows);
    });
});

module.exports = router;

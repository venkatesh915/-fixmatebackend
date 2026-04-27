const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'fixmate.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database', err.message);
    } else {
        console.log('Connected to SQLite database.');
        initDb();
    }
});

function initDb() {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Workers table
    db.run(`CREATE TABLE IF NOT EXISTS workers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        service_type TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        profile_image TEXT,
        shop_image TEXT,
        rating REAL DEFAULT 5.0,
        experience_years INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Insert mock workers if none exist
    db.get('SELECT COUNT(*) as count FROM workers', [], (err, row) => {
        if (!err && row.count === 0) {
            const stmt = db.prepare('INSERT INTO workers (name, phone, service_type, latitude, longitude, profile_image, rating, experience_years) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
            stmt.run('Raju Mechanic', '+919999911111', 'Mechanic', 28.6139, 77.2090, 'https://i.pravatar.cc/150?u=1', 4.8, 5);
            stmt.run('Amit Electrician', '+919999922222', 'Electrician', 28.6145, 77.2105, 'https://i.pravatar.cc/150?u=2', 4.5, 3);
            stmt.run('Vikas Plumber', '+919999933333', 'Plumber', 28.6120, 77.2080, 'https://i.pravatar.cc/150?u=3', 4.9, 8);
            stmt.finalize();
        }
    });
}

module.exports = db;

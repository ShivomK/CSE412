const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: 'shivomkhare', // Replace with your PostgreSQL username
    host: 'localhost',     // Replace with your host (default: localhost)
    database: 'shivomkhare', // Replace with your database name
    port: 1226            // Replace with your port (default: 5432)
});

// Fetch all countries with their continent
app.get('/api/countries', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.countryid, c.countryname, c.countrycode, co.continentname
            FROM country c
            JOIN continent co ON c.continentid = co.continentid
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Fetch temperature records for a specific country
app.get('/api/temperature/:countryid', async (req, res) => {
    try {
        const { countryid } = req.params;
        const result = await pool.query(`
            SELECT tr.year, tr.temperature, c.countryname
            FROM temperaturerecord tr
            JOIN country c ON tr.countryid = c.countryid
            WHERE tr.countryid = $1
            ORDER BY tr.year
        `, [countryid]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch all continents
app.get('/api/continents', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM continent');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch countries for a specific continent
app.get('/api/continent/:continentid/countries', async (req, res) => {
    try {
        const { continentid } = req.params;
        const result = await pool.query(`
            SELECT c.countryname, c.countrycode, c.countryid
            FROM country c
            JOIN continent co ON c.continentid = co.continentid
            WHERE co.continentid = $1
        `, [continentid]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/temperature/:countryid/:year1/:year2', async (req, res) => {
    try {
        const { countryid, year1, year2 } = req.params;
        const result = await pool.query(`
            SELECT tr.year, tr.temperature, c.countryname
            FROM temperaturerecord tr
            JOIN country c ON tr.countryid = c.countryid
            WHERE tr.countryid = $1
            AND tr.year BETWEEN $2 AND $3
        `, [countryid, year1, year2]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 2626;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

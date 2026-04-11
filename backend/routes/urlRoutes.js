const express = require("express");
const router = express.Router();
const db = require("../db");
const { nanoid } = require("nanoid");
const auth = require("../middleware/auth");

// Get user's URLs
router.get("/urls", auth, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('Fetching URLs for userId:', userId);
        const query = "SELECT id, original_url, short_code, clicks, created_at FROM urls WHERE user_id = ? ORDER BY created_at DESC";
        const [urls] = await db.query(query, [userId]);
        console.log('URLs found:', urls);
        res.json(urls);
    } catch (err) {
        console.error('Error fetching URLs:', err);
        res.status(500).json({ message: "Database error", error: err.message });
    }
});

// Get click history for a URL
router.get("/urls/:id/clicks", auth, async (req, res) => {
    try {
        const urlId = req.params.id;
        const userId = req.user.id;

        // First, check if the URL belongs to the user
        const [urlCheck] = await db.query("SELECT id FROM urls WHERE id = ? AND user_id = ?", [urlId, userId]);
        if (urlCheck.length === 0) {
            return res.status(404).json({ message: "URL not found" });
        }

        const query = "SELECT redirected_time FROM click_timestamps WHERE url_id = ? ORDER BY redirected_time DESC";
        const [clicks] = await db.query(query, [urlId]);
        res.json(clicks);
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
});

// Create short URL
router.post("/shorten", auth, async (req, res) => {
    try {
        const { originalUrl } = req.body;
        const userId = req.user.id;

        if (!originalUrl) {
            return res.status(400).send("URL is required");
        }

        // Validate URL
        try {
            new URL(originalUrl);
        } catch {
            return res.status(400).send("Invalid URL");
        }

        // Generate unique short code
        let shortCode;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10; // Prevent infinite loop

        while (!isUnique && attempts < maxAttempts) {
            shortCode = nanoid(6);
            const [existing] = await db.query("SELECT id FROM urls WHERE short_code = ?", [shortCode]);
            if (existing.length === 0) {
                isUnique = true;
            }
            attempts++;
        }

        if (!isUnique) {
            return res.status(500).send("Failed to generate unique short code");
        }

        const query = "INSERT INTO urls (original_url, short_code, user_id) VALUES (?, ?, ?)";

        await db.query(query, [originalUrl, shortCode, userId]);

        res.json({
            shortUrl: `http://10.1.50.172:${process.env.PORT}/${shortCode}`
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
});


// Redirect + Click Tracking
router.get("/:code", async (req, res) => {
    let connection;

    try {
        const code = req.params.code;

        // Get connection from pool
        connection = await db.getConnection();

        // Start transaction
        await connection.beginTransaction();

        // Fetch URL
        const selectQuery = "SELECT id, original_url FROM urls WHERE short_code = ?";
        const [rows] = await connection.query(selectQuery, [code]);

        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).send("URL not found");
        }

        const { id, original_url } = rows[0];

        // Insert click timestamp
        const clickInsertQuery =
            "INSERT INTO click_timestamps (url_id, redirected_time) VALUES (?, NOW())";
        await connection.query(clickInsertQuery, [id]);

        // Increment click count
        const updateQuery =
            "UPDATE urls SET clicks = clicks + 1 WHERE id = ?";
        await connection.query(updateQuery, [id]);

        // Commit transaction
        await connection.commit();

        // Redirect after successful commit
        res.redirect(original_url);

    } catch (err) {
        console.error(err);

        // Rollback on error
        if (connection) {
            await connection.rollback();
        }

        res.status(500).send("Server error");
    } finally {
        // Release connection back to pool
        if (connection) connection.release();
    }
});


module.exports = router;
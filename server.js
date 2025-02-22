const express = require("express");
const cors = require("cors");
app.use(cors({ origin: "*" }));
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000; // ✅ Fix for Render

app.use(express.json());
app.use(cors({ origin: "*" })); // ✅ Allow all origins (fix CORS error)

// Serve static frontend files (if needed)
app.use(express.static(path.join(__dirname, "public")));

// Store alerts in memory (Fix Render storage issue)
let alerts = [];

// Function to remove old alerts based on type
function cleanOldAlerts() {
    const now = Date.now();
    
    const EXPIRATION_TIMES = {
        "Traffic Jam": 10 * 60 * 1000, // 10 minutes
        "Accident": 60 * 60 * 1000, // 1 hour
        "Roadblock": 24 * 60 * 60 * 1000 // 24 hours
    };

    alerts = alerts.filter(alert => {
        const maxAge = EXPIRATION_TIMES[alert.type] || 24 * 60 * 60 * 1000; // Default 24h
        return now - alert.timestamp < maxAge;
    });

    console.log(`✅ Cleaned old alerts. Remaining: ${alerts.length}`);
}

// Run clean-up every 5 minutes
setInterval(cleanOldAlerts, 5 * 60 * 1000);

// Serve frontend index.html (if needed)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Get all alerts
app.get("/alerts", (req, res) => {
    cleanOldAlerts();
    res.json(alerts);
});

// Add a new alert
app.post("/alerts", (req, res) => {
    const newAlert = {
        type: req.body.type,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        timestamp: Date.now(),
    };

    alerts.push(newAlert);
    console.log(`🚨 New Alert Added: ${newAlert.type} at (${newAlert.latitude}, ${newAlert.longitude})`);
    
    res.status(201).json(newAlert);
});

// Start server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

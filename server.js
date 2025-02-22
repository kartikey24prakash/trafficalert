const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// Serve static frontend files
app.use(express.static(path.join(__dirname, "public")));

// Load alerts from JSON
let alerts = require("./alerts.json");

// Function to remove old alerts based on type
function cleanOldAlerts() {
    const now = Date.now();
    
    const EXPIRATION_TIMES = {
        "Traffic Jam": 10 * 60 * 1000, // 10 minutes
        "Accident": 60 * 60 * 1000, // 1 hour
        "Roadblock": 24 * 60 * 60 * 1000 // 24 hours
    };

    // Filter out expired alerts
    alerts = alerts.filter(alert => {
        const maxAge = EXPIRATION_TIMES[alert.type] || 24 * 60 * 60 * 1000; // Default 24h
        return now - alert.timestamp < maxAge;
    });

    // Save updated alerts back to alerts.json
    fs.writeFileSync("./alerts.json", JSON.stringify(alerts, null, 2));
}

// Run clean-up every 5 minutes
setInterval(cleanOldAlerts, 5 * 60 * 1000);

// Serve frontend index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Get all alerts
app.get("/alerts", (req, res) => {
    cleanOldAlerts(); // Clean old alerts before sending
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

    fs.writeFile("./alerts.json", JSON.stringify(alerts, null, 2), (err) => {
        if (err) {
            console.error("Error saving alert:", err);
            res.status(500).send("Error saving alert.");
        } else {
            res.status(201).json(newAlert);
        }
    });
});

// Start server
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));

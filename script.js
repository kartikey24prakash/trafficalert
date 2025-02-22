const API_URL = "https://trafficalert.onrender.com/alerts"; // ✅ Replace with actual Render URL

// Fetch alerts from backend and display them on the map
fetch(API_URL)
    .then(response => response.json())
    .then(alerts => {
        console.log("✅ Fetched alerts from server:", alerts); // Debugging
        alerts.forEach(addAlertToMap);
    })
    .catch(error => console.error("❌ Error fetching alerts:", error));



// Initialize the map with a default view (New Delhi) as fallback
let map = L.map("map").setView([28.7041, 77.1025], 10); // Default: Delhi, India


// Add OpenStreetMap tile layer
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);




// Function to get user's location and set map view
function setUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                let userLat = position.coords.latitude;
                let userLon = position.coords.longitude;
                
                // Set the map view to the user's current location
                map.setView([userLat, userLon], 14);  // Zoom level 14 is closer to the user

                // Optionally, you can add a marker for the user's location
                L.marker([userLat, userLon])
                    .addTo(map)
                    .bindPopup("You are here")
                    .openPopup();
            },
            (error) => {
                console.error("Geolocation error:", error);
                alert("Location access denied! Using default (New Delhi).");
                // Fallback to a default location (New Delhi)
                map.setView([28.7041, 77.1025], 10);  // Default: New Delhi
            }
        );
    } else {
        alert("Geolocation is not supported by your browser.");
        // Fallback to a default location (New Delhi)
        map.setView([28.7041, 77.1025], 10);  // Default: New Delhi
    }
}

// Call the function to set the user's location as the default map view
setUserLocation();

let userMarker = null; 
// Function to track and update user's location in real-time
function trackUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                let userLat = position.coords.latitude;
                let userLon = position.coords.longitude;

                console.log("✅ Updating Location: ", userLat, userLon);

                // Move existing marker or create a new one
                if (userMarker) {
                    userMarker.setLatLng([userLat, userLon]);
                } else {
                    userMarker = L.marker([userLat, userLon], {
                        icon: L.icon({
                            iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png", // Blue icon for user
                            iconSize: [30, 30],
                        })
                    }).addTo(map).bindPopup("📍 Your Current Location");
                }

                // Keep map centered on the user's latest position
                map.setView([userLat, userLon], 14);
            },
            (error) => {
                console.error("❌ Geolocation error:", error);
                alert("Failed to get location. Please allow location access.");
            },
            {
                enableHighAccuracy: true, // Use GPS for more precision
                maximumAge: 5000, // Only use location data from the last 5 seconds
                timeout: 10000, // Wait max 10s before error
            }
        );
    } else {
        alert("Geolocation is not supported by your browser.");
    }
}

// Start tracking the user's location
trackUserLocation();







// Store coordinates for alert reporting
let alertLocation = { lat: null, lon: null };
let currentMarker = null; // Store the marker reference

// Add click event to map to allow user to select location for the alert
map.on('click', function (e) {
    let clickedLat = e.latlng.lat;
    let clickedLon = e.latlng.lng;

    // Store the selected location
    alertLocation.lat = clickedLat;
    alertLocation.lon = clickedLon;

    // If there's an existing marker, remove it
    if (currentMarker) {
        map.removeLayer(currentMarker);
    }

    // Add a new marker at the clicked location
    currentMarker = L.marker([clickedLat, clickedLon])
        .addTo(map)
        .bindPopup("Alert Location")
        .openPopup();




    // Display the coordinates in the input fields (optional)
    //document.getElementById("alert-location").value = `Lat: ${clickedLat}, Lon: ${clickedLon}`;
    if (document.getElementById("alert-location")) {
        document.getElementById("alert-location").value = `Lat: ${alertLocation.lat}, Lon: ${alertLocation.lon}`;
    }
    
   

});


function reportUserAlert() {
    const type = document.getElementById("alert-type").value;

    // Listen for map clicks to get the correct location
    map.once("click", function (e) {
        let lat = e.latlng.lat;
        let lon = e.latlng.lng;

        let alertData = { type, latitude: lat, longitude: lon, timestamp: Date.now() };

        const backendURL = "https://https://trafficalert.onrender.com"; // Your Render backend URL
        fetch(`${backendURL}/alerts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(alertData)
        })


        .then(response => {
            if (!response.ok) throw new Error("Failed to report alert");
            return response.json();
        })
        .then(data => {
            addAlertToMap(data);
            alert("Traffic alert reported successfully!");
        })
        .catch(error => {
            console.error("Error reporting alert:", error);
            alert("Failed to submit alert.");
        });
    });

    alert("Click on the map to set the alert location!");
}


function addAlertToMap(alert) {
    if (!alert.latitude || !alert.longitude) {
        console.error("❌ Missing coordinates in alert:", alert);
        return;
    }

    

    console.log(`📍 Adding marker at (${alert.latitude}, ${alert.longitude}) for ${alert.type}`);

    L.marker([alert.latitude, alert.longitude])
        .addTo(map)
        .bindPopup(`<strong>Type: </strong>${alert.type}`)
        .openPopup();
}


function addAlertMarker(alertData) {
    let alertCoords = [alertData.latitude, alertData.longitude];
    let alertType = alertData.type;
    let timestamp = alertData.timestamp;
    
    // Define expiration time based on alert type
    let expirationTimes = {
        "Traffic Jam": 10 * 60 * 1000,  // 10 minutes
        "Accident": 60 * 60 * 1000,    // 1 hour
        "Roadblock": 24 * 60 * 60 * 1000 // 24 hours
    };

    let expiryTime = expirationTimes[alertType];
    let remainingTime = expiryTime - (Date.now() - timestamp);

    if (remainingTime > 0) {
        let minutesRemaining = Math.floor(remainingTime / 60000);
        let hoursRemaining = Math.floor(remainingTime / 3600000);

        let timeText = minutesRemaining < 60 
            ? `${minutesRemaining} minutes remaining` 
            : `${hoursRemaining} hours remaining`;

        let marker = L.marker(alertCoords, {
            icon: L.icon({
                iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                iconSize: [30, 30]
            })
        }).addTo(map).bindPopup(`
            <strong>Type:</strong> ${alertType}<br>
            <strong>Time Left:</strong> ${timeText}<br>
            <strong>Reported:</strong> ${new Date(timestamp).toLocaleTimeString()}
        `);
        
        // Remove marker after expiration time
        setTimeout(() => {
            map.removeLayer(marker);
        }, remainingTime);
    }
}


// Function to find the route
function calculateRoute() {
    let start = document.getElementById("start").value;
    let end = document.getElementById("end").value;

    if (!start || !end) {
        alert("Please enter both locations.");
        return;
    }

    // Use OpenStreetMap's Nominatim API to get coordinates
    let nominatimURL = "https://nominatim.openstreetmap.org/search?format=json&q=";
    
    Promise.all([
        fetch(nominatimURL + encodeURIComponent(start)).then(res => res.json()),
        fetch(nominatimURL + encodeURIComponent(end)).then(res => res.json())
    ])
    .then(results => {
        if (results[0].length === 0 || results[1].length === 0) {
            alert("Location not found. Try again.");
            return;
        }

        let startCoords = [results[0][0].lat, results[0][0].lon];
        let endCoords = [results[1][0].lat, results[1][0].lon];

        // Clear existing layers
        map.eachLayer(layer => {
            if (!!layer.toGeoJSON) {
                map.removeLayer(layer);
            }
        });

        // Add markers for start and end points
        let startMarker = L.marker(startCoords).addTo(map).bindPopup("Start: " + start).openPopup();
        let endMarker = L.marker(endCoords).addTo(map).bindPopup("End: " + end);

        // Add the bounce effect by applying the 'bounce' class to markers
        startMarker._icon.classList.add("bounce");
        endMarker._icon.classList.add("bounce");

        // Remove the bounce class after 1 second (animation time)
        setTimeout(() => {
            startMarker._icon.classList.remove("bounce");
            endMarker._icon.classList.remove("bounce");
        }, 1000); // 1000ms = 1 second

        // Fit map to route
        map.fitBounds([startCoords, endCoords]);

        // Draw route using OpenRouteService API (Free, but needs key)
        fetch(`https://router.project-osrm.org/route/v1/driving/${startCoords[1]},${startCoords[0]};${endCoords[1]},${endCoords[0]}?overview=full&geometries=geojson`)
        .then(res => res.json())
        .then(data => {
            if (data.routes.length > 0) {
                let route = data.routes[0].geometry;

                // Create a GeoJSON layer for the route
                let routeLayer = L.geoJSON(route, {
                    style: { 
                        color: "blue", 
                        weight: 5, 
                        opacity: 0 // Initially set opacity to 0 for animation
                    }
                }).addTo(map);

                // Animate the route (fade-in effect)
                routeLayer.setStyle({ opacity: 1 }); // Gradually make the route visible
            } else {
                alert("No route found.");
            }
        })
        .catch(err => console.error(err));
    })
    .catch(err => console.error(err));
}

// Add real-time traffic layer using OpenStreetMap
let trafficLayer = L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
});

// Toggle Traffic Layer (Enable/Disable)
let trafficEnabled = false;
function toggleTraffic() {
    if (trafficEnabled) {
        map.removeLayer(trafficLayer);
    } else {
        trafficLayer.addTo(map);
        // Adding a fade-in effect for the traffic layer
        trafficLayer.setOpacity(0); // Initially set opacity to 0
        setTimeout(() => trafficLayer.setOpacity(1), 200); // Fade in after 200ms
    }
    trafficEnabled = !trafficEnabled;
}

// Add a button for toggling traffic
let trafficButton = L.control({ position: "topright" });
trafficButton.onAdd = function () {
    let btn = L.DomUtil.create("button", "leaflet-bar");
    btn.innerHTML = "🚦 Toggle Traffic";
    btn.style.padding = "5px";
    btn.onclick = toggleTraffic;
    return btn;
};
trafficButton.addTo(map);


// Function to get user's location for autocomplete
function getUserLocation(callback) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                let userLat = position.coords.latitude;
                let userLon = position.coords.longitude;
                callback(userLat, userLon);
            },
            (error) => {
                console.error("Geolocation error:", error);
                alert("Location access denied! Using default (New Delhi).");
                callback(28.6139, 77.2090); // Default location
            }
        );
    } else {
        alert("Geolocation is not supported by your browser.");
        callback(28.6139, 77.2090); // Default location
    }
}

// Add AutoComplete functionality
function addAutoComplete(inputId, userLat, userLon) {
    let input = document.getElementById(inputId);
    let bboxSize = 0.5; // Defines the nearby search area

    input.addEventListener("input", function () {
        let query = this.value.trim();
        if (query.length < 3) return; // Only search after 3 characters

        let minLat = userLat - bboxSize;
        let maxLat = userLat + bboxSize;
        let minLon = userLon - bboxSize;
        let maxLon = userLon + bboxSize;

        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&bounded=1&viewbox=${minLon},${minLat},${maxLon},${maxLat}`)
            .then(res => res.json())
            .then(data => {
                let listId = inputId + "-autocomplete";
                let existingList = document.getElementById(listId);
                if (existingList) existingList.remove();

                let list = document.createElement("ul");
                list.id = listId;
                list.style.position = "absolute";
                list.style.top = input.getBoundingClientRect().bottom + window.scrollY + "px";
                list.style.left = input.getBoundingClientRect().left + "px";
                list.style.width = input.offsetWidth + "px";
                list.style.background = "white";
                list.style.border = "1px solid gray";
                list.style.padding = "5px";
                list.style.listStyle = "none";
                list.style.maxHeight = "150px";
                list.style.overflowY = "auto";
                list.style.zIndex = "1000";
                list.style.boxShadow = "0px 4px 6px rgba(0,0,0,0.1)";
                list.style.borderRadius = "5px";

                if (data.length === 0) {
                    let noResult = document.createElement("li");
                    noResult.textContent = "No nearby places found.";
                    noResult.style.padding = "10px";
                    noResult.style.color = "gray";
                    list.appendChild(noResult);
                } else {
                    data.slice(0, 5).forEach(place => {
                        let item = document.createElement("li");
                        item.style.cursor = "pointer";
                        item.style.padding = "10px";
                        item.style.borderBottom = "1px solid #ddd";
                        item.style.fontSize = "14px";
                        item.textContent = place.display_name;
                        item.addEventListener("click", () => {
                            input.value = place.display_name;
                            let coords = [place.lat, place.lon];
                            map.setView(coords, 14);
                            L.marker(coords).addTo(map).bindPopup(place.display_name).openPopup();
                            list.remove();
                        });
                        list.appendChild(item);
                    });
                }
                document.body.appendChild(list);
            });
    });
}

// Initialize autocomplete
getUserLocation((userLat, userLon) => {
    addAutoComplete("start", userLat, userLon);
    addAutoComplete("end", userLat, userLon);
});


map.eachLayer(layer => {
    if (layer instanceof L.TileLayer) {
        return; // Don't remove the tile layer
    }
    if (!!layer.toGeoJSON) {
        map.removeLayer(layer);
    }
});

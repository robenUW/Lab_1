/* Map of GeoJSON data from crocs.geojson */
// Declare map variable in global scope
var map;
var minValue;
var timestamps = [];

// Step 1: Function to initiate the Leaflet map
function createMap() {
    // Create the map
    map = L.map('map', {
        center: [-12, 142],
        zoom: 9
    });

    // Add OSM base tilelayer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }).addTo(map);

    // Call getData function
    getData(map);
};

function calculateMinValue(data) {
    var allValues = []; // Create empty array to store all data values

    for (var feature of data.features) { // Loop through each feature
        var value = feature.properties["total length (cm)"]; // Get value for current feature

        if (typeof value === 'number') {
            allValues.push(value); // Add value to array
        } else {
            console.log('Invalid value:', value, 'in object:', feature);
        }
    }

    // Get minimum value of our array
    var minValue = Math.min(...allValues);
    console.log("minValue:", minValue); // Checking the values

    return minValue;
}

// Calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    // Constant factor adjusts symbol sizes evenly
    var minRadius = 1;
    // Flannery Appearance Compensation formula
    var radius = 2.5 * Math.pow(attValue / minValue, 6) * minRadius;

    return radius;
};

// Function to assign colors to each name
function getColor(crocName) {
    var colors = {
        "Aristotle": "#ff0000",
        "Hamish": "#FFFF00",
        "Ryan": "#33FF33",
        "Tarlisha": "#660066",
        // Add more croc names and colors here
    };
    return colors[crocName] || "#00ff00";
}

function pointToLayer(feature, latlng) {
    // Determine which attribute to visualize with proportional symbols
    var attribute = "total length (cm)";

    // Create marker options
    var options = {
        fillColor: getColor(feature.properties['croc name']),
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    // For each feature, determine its value for the selected attribute
    var attValue = feature.properties[attribute];

    // Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    // Create circle marker layer
    var layer = L.circleMarker(latlng, options);

    // Build popup content string
    var popupContent = "<p><b>Size (cm):</b> " + feature.properties["total length (cm)"] + "<p><b>Croc Name:</b> " + feature.properties["croc name"];

    // Bind the popup to the circle marker
    layer.bindPopup(popupContent);

    // Return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

// Function to add circle markers for point features to the map
function createPropSymbols(data, map, timestamp) {
    // Filter data based on the selected timestamp
    var filteredData = {
        type: "FeatureCollection",
        features: data.features.filter(function (feature) {
            return feature.properties["GPS Fix Time"] === timestamp;
        })
    };

    // Create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(filteredData, {
        pointToLayer: function (feature, latlng) {
            // Check if lat and lng are not undefined and are numbers
            if (latlng.lat !== undefined && !isNaN(latlng.lat) && latlng.lng !== undefined && !isNaN(latlng.lng)) {
                // If valid, use your pointToLayer function
                return pointToLayer(feature, latlng);
            } else {
                console.error(`Invalid latitude or longitude: ${latlng.lat}, ${latlng.lng}`);
                return null; // Return null if latlng is invalid
            }
        }
    }).addTo(map);
};

// Create new sequence controls
function createSequenceControls() {
    // Create range input element (slider)
    var slider = "<input class='range-slider' type='range'></input>";
    document.querySelector("#panel").insertAdjacentHTML('beforeend', slider);

    // Set slider attributes
    document.querySelector(".range-slider").max = timestamps.length - 1;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;

    // Add buttons
    document.querySelector('#panel').insertAdjacentHTML('beforeend', '<button class="step" id="reverse">Reverse</button>');
    document.querySelector('#panel').insertAdjacentHTML('beforeend', '<button class="step" id="forward">Forward</button>');
    document.querySelector('#reverse').insertAdjacentHTML('beforeend', "<img src='img/reverse.png'>");
    document.querySelector('#forward').insertAdjacentHTML('beforeend', "<img src='img/forward.png'>");

    // Add event listeners for buttons and slider
    document.querySelector('.range-slider').addEventListener('input', function () {
        updateMap(this.value);
    });
    document.querySelector('#reverse').addEventListener('click', function () {
        var slider = document.querySelector('.range-slider');
        if (slider.value > slider.min) {
            slider.value--;
            updateMap(slider.value);
        }
    });
    document.querySelector('#forward').addEventListener('click', function () {
        var slider = document.querySelector('.range-slider');
        if (slider.value < slider.max) {
            slider.value++;
            updateMap(slider.value);
        }
    });
};

// Function to update the map based on the selected timestamp
function updateMap(index) {
    var timestamp = timestamps[index];
    // Clear existing layers
    map.eachLayer(function (layer) {
        if (layer instanceof L.GeoJSON) {
            map.removeLayer(layer);
        }
    });
    // Fetch the data and re-add the filtered data
    fetch("data/crocs3.geojson")
        .then(function (response) {
            return response.json();
        })
        .then(function (json) {
            minValue = calculateMinValue(json);
            createPropSymbols(json, map, timestamp);
        });
};

// Build an attributes array from the data
function processData(data) {
    // Empty array to hold timestamps
    var attributes = [];

    // Loop through each feature to get timestamps
    for (var feature of data.features) {
        var timestamp = feature.properties["GPS Fix Time"];
        if (!attributes.includes(timestamp)) {
            attributes.push(timestamp);
        }
    }

    // Sort timestamps
    attributes.sort();
    timestamps = attributes;

    // Check result
    console.log(attributes);

    return attributes;
};

// Function to retrieve the data and place it on the map
function getData(map) {
    fetch("data/crocs_test.geojson")
        .then(function (response) {
            return response.json();
        })
        .then(function (json) {
            minValue = calculateMinValue(json);
            processData(json);
            createPropSymbols(json, map, timestamps[0]);
            createSequenceControls();
        });
};

document.addEventListener('DOMContentLoaded', createMap);
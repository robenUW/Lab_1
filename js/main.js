/* Map of GeoJSON data from crocs.geojson */
//declare map var in global scope
var map;
var minValue
var timestamps = []

// function to initiate the Leaflet map
function createMap(){
    //create the map
    map = L.map('map', {
        center: [-12, 142],
        zoom: 9
    });

    //add OSM base tilelayer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }).addTo(map);

    //call getData function
    getData(map)

};

//calculate min value in fuction - data refers to json passed at the end
function calculateMinValue(data){
    //create empty array to store all data values
    var allValues = [];    
    //loop through each row
    for(var size of data.features){    
        // access each row throug size, and properties accesses the size for each row
        var value = size.properties["total length (cm)"]; 
        // if the value type is a number passes it through the array
        if (typeof value === 'number') {
            allValues.push(value);   //add value to array
        // if the value isnt a number, produces an error 
        } else {
            console.log('Invalid value:', value, 'in object:', size);
        }
    }
        
    // Get minimum value of our array
    var minValue = Math.min(...allValues);
    console.log("minValue:", minValue); // Checking the values

    return minValue;

}
//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 1;
    //Flannery Apperance Compensation formula
    var radius = 2.5 * Math.pow(attValue/minValue,6) * minRadius

    return radius;
};


//function to assign colors to each name
function getColor(crocName) {
    var colors = {
        "Aristotle": "#ff0000",
        "Hamish": "#FFFF00",
        "Ryan": "#33FF33",
        "Tarlisha": "#660066",    
        // Add more croc names and colors here
    };
    //others with no name will appear in this color
    return colors[crocName] || "#00ff00";
}

function pointToLayer(feature, latlng){
    //Determine which attribute to visualize with proportional symbols
    //assign the current attribute based on the first index of the attributes array
    var attribute = "total length (cm)";
    //create marker options
    var options = {
        fillColor: getColor(feature.properties['croc name']),
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //For each feature, determine its value for the selected attribute
    var attValue = feature.properties[attribute];


    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);
    
    //create circle marker layer
    var layer = L.circleMarker(latlng, options);
    
    //build popup content string
    var popupContentsize = "<p><b>Size (cm):</b>,  " + feature.properties["total length (cm)"] 
    + "<p><b>Croc Name:</b> " + feature.properties["croc name"] + 
    "<p><b>GPS Fix Time:</b> " + feature.properties["GPS Fix Time"] + 
    "<p><b>id:</b> " + feature.properties["OBJECTID"]
    
    //bind the popup to the circle marker
    layer.bindPopup(popupContentsize);
    //return the circle marker to the L.geoJson pointToLayer option
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
        pointToLayer: function(feature, latlng) {
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
function createSequenceControls(){
    //create range input element (slider)
    var slider = "<input class='range-slider' type='range'></input>";
    document.querySelector("#panel").insertAdjacentHTML('beforeend',slider);

    //set slider attributes
    document.querySelector(".range-slider").max = timestamps.length - 1;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;

    // add buttons
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="forward">Forward</button>');
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="reverse">Reverse</button>');
   
    //replace buttons with images
    document.querySelector('#forward').insertAdjacentHTML('beforeend',"<img src='img/forward.png'>")
    document.querySelector('#reverse').insertAdjacentHTML('beforeend',"<img src='img/reverse.png'>")
    



    // Add event listeners for buttons and slider
    document.querySelector('.range-slider').addEventListener('input', function () {
        updateMap(this.value);
    });


     // adds event listener for the slider when user clicks forward
    document.querySelector('#forward').addEventListener('click', function () {
        var slider = document.querySelector('.range-slider');
        if (slider.value <= 3000) {
            slider.value++;
            updateMap(slider.value);
        }
    });

    // adds event listener for the slider when user clicks reverse
    document.querySelector('#reverse').addEventListener('click', function () {
        var slider = document.querySelector('.range-slider');
        if (slider.value > slider.min) {
            slider.value--;
            updateMap(slider.value);
        }
    });
};

//Function to update the map based on the selected timestamp
function updateMap(index) {
    var timestamp = timestamps[index];

    // Clear existing layers
    map.eachLayer(function (layer) {
        if (layer instanceof L.GeoJSON) {
            map.removeLayer(layer);
        }
    });

    // Fetch the data and re-add the filtered data
    fetch("data/crocs_fin.geojson")
        .then(function (response) {
            return response.json();
        })
        .then(function (json) {
            minValue = calculateMinValue(json);
            createPropSymbols(json, map, timestamp);
        });
};


//build attributes array from the data
function processData(data){
    
    var attributes = [] //empty array

    //loop through each feature
    for (var feature of data.features){
        var timestamp = feature.properties["GPS Fix Time"];
        if (!attributes.includes(timestamp)) {
            console.log(timestamp)
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




//function to retrieve the data and place it on the map
function getData(map){
    //load the json from data folder
    fetch("data/crocs_fin.geojson")
        .then(function(response){
            return response.json();
        })

        .then(function(json){
            //adds min values function to map for visual
            minValue = calculateMinValue(json)
            //runs function to get time stamp
            processData(json)

             //call function to create propertional symbols
            createPropSymbols(json, map, timestamps[0]);
            createSequenceControls(timestamps);     
        })

// Add legend to map
        var legend = L.control({position: 'bottomright'});
        legend.onAdd = function (map) {
            var div = L.DomUtil.create('div', 'legend');
            var crocNames = ["Aristotle", "Hamish", "Ryan", "Tarlish"]; // Add more croc names here
            var colors = ["#ff0000", "#FFFF00", "#33FF33", "#660066"]; // Corresponding color

            // Loop through croc names and generate a label with a colored square for each
            for (var i = 0; i < crocNames.length; i++) {
                div.innerHTML +=
                    '<i class="circle" style="background:' + colors[i] + '"></i> ' +
                    crocNames[i] + '<br>';
            }
            return div;
        };
        legend.addTo(map);
};

document.addEventListener('DOMContentLoaded',createMap);// Loop through croc names and generate a label with a colored square for each


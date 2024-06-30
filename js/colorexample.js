/* Map of GeoJSON data from MegaCities.geojson */
//declare map var in global scope
var map;
//function to instantiate the Leaflet map
function createMap(){
    //create the map
    map = L.map('map', {
        center: [-12, 142],
        zoom: 10
    });

    //add OSM base tilelayer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }).addTo(map);

    //call getData function
    getData(map)
};

//function to attach popups to each mapped feature
function onEachFeature(feature, layer) {
    //no property named popupContent; instead, create html string with all properties
    var popupContent = "";
    if (feature.properties) {
        //loop to add feature property names and values to html string
        for (var property in feature.properties){
            popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
        }
        layer.bindPopup(popupContent);
    };
};

// Function to assign colors based on croc names
function getColor(crocName) {
    var colors = {
        "Aristotle": "#ff0000",
        "Hamish": "#0000ff",
        // Add more croc names and colors here
    };
    return colors[crocName] || "#00ff00"; // Default color if name is not found
}

//function to retrieve the data and place it on the map
function getData(map){
    fetch("data/crocs2.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create a Leaflet GeoJSON layer and add it to the map
            L.geoJson(json, {
                onEachFeature: onEachFeature,
                pointToLayer: function (feature, latlng){
                    // Define marker options with dynamic fillColor
                    var geojsonMarkerOptions = {
                        radius: 8,
                        fillColor: getColor(feature.properties['croc name']),
                        color: "#000",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    };
                    //add circle marker to map
                    return L.circleMarker(latlng, geojsonMarkerOptions);
                }
            }).addTo(map);

            // Add legend to map
            var legend = L.control({position: 'bottomright'});
            legend.onAdd = function (map) {
                var div = L.DomUtil.create('div', 'info legend');
                var crocNames = ["Aristotle", "Hamish"]; // Add more croc names here
                var colors = ["#ff0000", "#0000ff"]; // Corresponding colors
                
                // Add CSS styling for the legend
                div.innerHTML += '<style>\
                    .legend {\
                        background: white;\
                        padding: 10px;\
                        border-radius: 5px;\
                        box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);\
                    }\
                    .legend i {\
                        width: 18px;\
                        height: 18px;\
                        float: left;\
                        margin-right: 8px;\
                        opacity: 0.7;\
                    }\
                </style>';

                // Loop through croc names and generate a label with a colored square for each
                for (var i = 0; i < crocNames.length; i++) {
                    div.innerHTML +=
                        '<i style="background:' + colors[i] + '"></i> ' +
                        crocNames[i] + '<br>';
                }
                return div;
            };
            legend.addTo(map);
        });
};

document.addEventListener('DOMContentLoaded',createMap);
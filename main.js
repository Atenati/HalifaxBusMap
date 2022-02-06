(function(){
    // Template featurecollection, will contain all buses (features)
    let geoJsonFeature = {
        "type": "FeatureCollection",
        "features": []
    };

    // bus icon
    var busIcon = L.Icon.extend({
        iconUrl: 'bus.png',
        iconSize: [38, 38],
        iconAnchor: [38, 18],
        popupAnchor: [-5, -20]
    });

    var map = L.map('theMap').setView([44.65858444537563, -63.57337493078659], 13); // set view to halifax

    // dark leaflet theme from: http://leaflet-extras.github.io/leaflet-providers/preview/
    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', { 
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright%22%3EOpenStreetMap</a> contributors'
    }).addTo(map);

    /**
     * Fetches json data, filters to buses on route 1-10 inclusive
     * for each bus, add as feature in above featurecollection, record lat/lng and route#
     * @returns filtered fetch
     */
    function halifaxBusData() {
        var buses = [];
        
        return fetch('https://hrmbusapi.herokuapp.com/')
        .then(response => response.json())
        .then(json => {
            // filter buses between 1-10 inclusively
            buses = json.entity.filter(arr => arr.vehicle.trip.routeId < 11 && arr.vehicle.trip.routeId > 0);

            for(x in buses) { // for each bus
                let lat = buses[x].vehicle.position.latitude; // record lat
                let long = buses[x].vehicle.position.longitude; // record long
                let feature = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [parseFloat(long), parseFloat(lat)], // parse to float
                        "rotationAngle": parseInt(buses[x].vehicle.position.bearing) // record bearing
                    },
                    "properties": {
                        "name": buses[x].vehicle.trip.routeId
                    }
                };
                geoJsonFeature.features.push(feature);
            }
        })
    }

    /**
     * Populates geoJSON FeatureCollection with current bus positions
     * after 500 seconds (allow json data to load) publish buses on map with update function
     * after 7.1 seconds, recursively call function
     */
    function refreshBusPos() {
        halifaxBusData();
        setTimeout(update, 500);
        geoJsonFeature.features = [];

        setTimeout(refreshBusPos, 7100);
    }

    /**
     * creates layer with bus icons on proper rotation angle
     * bind popup to feature
     * adds layer to map
     * clear layer every 7.1 seconds
     */
    function update() {        
        var busLayer = L.geoJSON(geoJsonFeature, {
            pointToLayer: function(feature, latlng) {
                return new L.Marker(latlng, {
                    icon: new busIcon({
                        iconUrl: 'bus.png', // icon url
                        iconSize: [38, 38] // icon size
                    }),
                    rotationAngle: feature.geometry.rotationAngle
                })
            },
            onEachFeature: function(feature, layer) {
                layer.bindPopup('<h4>Bus No. ' + feature.properties.name + '</h4>'); // bind popup to layer feature
            }
        }).addTo(map);
        
        setInterval(function() { // anonymous function to clear bus layer after 7.1 seconds
            busLayer.clearLayers();
        }, 7100)
    }
    
    refreshBusPos(); // starts main program loop

})()
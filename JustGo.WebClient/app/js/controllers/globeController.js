import globe from '../utils/globe.js';
import notifier from '../utils/notifier.js';
import templateGenerator from '../utils/templateGenerator.js';
import persister from '../data/persister.js';
import placesData from '../data/places.js';
import tripsData from '../data/trips.js';

var PLACE_SUCCESSFULLY_SAVED_MESSAGE = 'Place successfully saved!',
    CANNOT_FIND_PLACE_INFO = 'Try again,  there\'s nothing out there',
    URL = {
        POPUP: 'app/views/globePopUp.html',
        PLACE: 'app/views/globePlace.html',
        GLOBE_VIEW: 'app/views/globeView.html'
    };

var marker,
    map,
    place,
    places,
    trip,
    input,
    searchBox,
    $tripContainer,
    $placeContainer,
    $wrapper,
    $mainContent = $('#main-content'),
    spinning = false;

function init() {
    templateGenerator
        .get(URL.GLOBE_VIEW)
        .then(function (template) {
            $mainContent.html(template());
        })
        .then(function () {
            bindEvents();
        });
}

function bindEvents() {
    place = {};
    places = [];
    map = globe.init();
    input = document.getElementById('pac-input');
    searchBox = new google.maps.places.SearchBox(input);
    $wrapper = $('#globe-view');
    $tripContainer = $('#trip-container');
    $placeContainer = $('#place-container');

    $tripContainer.hide();

    map.on('click', function (e) {
        if (!e.latlng) {
            return;
        }

        addMarker(e.latlng.lat, e.latlng.lng);
    });

    //google maps Search input
    searchBox.addListener('places_changed', function () {
        var places = searchBox.getPlaces();

        if (places.length === 0) {
            return;
        }

        places.forEach(function (place) {
            var lat = place.geometry.location.G;
            var long = place.geometry.location.K;

            globe.panTo([lat, long]);
            addMarker(lat, long);
        });
    });

    $wrapper.on('click', '#spin', function () {
        spinning = !spinning;
        if (spinning) {
            globe.spin();
        } else {
            persister
                .getAllCountry()
                .then(function (data) {
                    var position = setMarkerOnRandomPosition(data);

                    globe.spin();

                    setTimeout(function () {
                        globe.panTo(position);
                    }, 50);
                });
        }
    });

    $wrapper.on('click', '#random', function () {
        persister
            .getAllCountry()
            .then(function (data) {
                var position = setMarkerOnRandomPosition(data);

                globe.panTo(position);
            });
    });

    $wrapper.on('click', '#add-place', function () {
        addPlace(place);
    });

    $wrapper.on('click', '#save-place', function () {
        var $this = $(this);
        var $parentLi = $this.closest('li');
        var index = $parentLi.attr('data-id') - 1;

        var place = places[index];

        placesData
            .create(place)
            .then(function (data) {
                notifier.alertSuccess(PLACE_SUCCESSFULLY_SAVED_MESSAGE);
            })
            .catch(function (err) {
                notifier.alertError(err);
            });
    });

    $wrapper.on('click', '#remove-place', function () {
        var $this = $(this);
        var $parentLi = $this.closest('li');
        var index = $parentLi.attr('data-id') - 1;

        $parentLi.remove();
        places.splice(index, 1);

        if (!places.length) {
            $tripContainer.hide();
        }
    });

    $wrapper.on('click', '#save-trip', function () {
        var trip = places.slice(),
            from = trip.shift(),
            to = trip.pop(),
            waypoints = trip,
            data = {
                from: from,
                to: to
            };

        if (waypoints.length > 0) {
            data.waypoints = waypoints;
        }

        tripsData
            .create(data)
            .then(function (data) {
                $tripContainer.hide();
            });
    });

    $wrapper.on('click', '#remove-all', function () {
        places = [];
        $placeContainer.html('');
        $tripContainer.hide();
    });
}

function setMarkerOnRandomPosition(data) {
    var randomCountry = data[Math.random() * 250 | 0];
    var lat = randomCountry[1];
    var long = randomCountry[2];

    addMarker(lat, long);

    return [lat, long];
}

function addPlace(place) {
    for (var i = 0; i < places.length; i += 1) {
        if (places[i].latitude === place.latitude && places[i].longitude === place.longitude) {
            return;
        }
    }

    places.push(place);

    var templateObject = {
        name: place.name,
        latitude: place.latitude,
        longitude: place.longitude,
        id: places.length
    };

    templateGenerator
        .get(URL.PLACE)
        .then(function (template) {
            $placeContainer.append(template(templateObject));
        });

    if (places.length == 1) {
        $tripContainer.slideDown();
    }
}

function addMarker(lat, long) {
    var countryData;

    if (marker) {
        marker.removeFrom(map);
    }

    marker = WE.marker([lat, long]).addTo(map);
    persister
        .getCityByGeoLocation(lat, long)
        .then(function (data) {
            countryData = data.results;
            var countryDataLastIndex = countryData.length - 1;
            place = {
                country: countryData[countryDataLastIndex].formatted_address,
                state: countryData[countryDataLastIndex - 1].formatted_address,
                name: countryData[countryDataLastIndex - 2].formatted_address,
                latitude: lat,
                longitude: long
            };
        })
        .then(function () {
            return templateGenerator
                .get(URL.POPUP)
        })
        .then(function (template) {
            marker.bindPopup(template(place), {
                maxWidth: 150,
                closeButton: true
            }).openPopup();
        })
        .catch(function () {
            notifier.alertError(CANNOT_FIND_PLACE_INFO);
        });


    setTimeout(function () {
        $('.we-pp-close').removeAttr('href');
    }, 500);
}

export default {
    init
};

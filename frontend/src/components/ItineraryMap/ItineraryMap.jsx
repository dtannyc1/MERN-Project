import { Wrapper } from "@googlemaps/react-wrapper";
import { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import '../ItineraryShowPage/ItineraryShowPage.css'
import './ItineraryMap.css';

import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createItinerary, fetchItinerary } from "../../store/itineraries";
import activityTypes from "./ActivityTypes";
import ActivityItem from "../ItineraryShowPage/ActivityItem";
import InstructionsModal, { instructions } from "./InsructionsModal";
import { selectCurrentUser } from "../../store/session";
import LoginForm from "../SessionForms/LoginForm";
import { Modal } from "../context/Modal";
import LoadingAnimation from "./LoadingAnimation";

const ItineraryMap = ({ mapOptions = {} }) => {
    const dispatch = useDispatch();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const locationParam = searchParams.get('location');
    const typeParam = searchParams.get('type');
    const currentUser = useSelector(selectCurrentUser);

    const [lat, setLat] = useState(0);
    const [lng, setLng] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const [map, setMap] = useState(null);
    const [type, setType] = useState(typeParam || "cafe");
    const [number, setNumber] = useState(3);
    const [itineraryTitle, setItineraryTitle] = useState('');
    const [showModal, setShowModal] = useState(false);

    const mapRef = useRef(null);
    const generatedMarkers = useRef([]);
    const selectedMarkers = useRef([]);
    const history = useHistory();

    const [selectedActivities, setSelectedActivities] = useState([]); // selected activity for itinerary
    const [generatedActivities, setGeneratedActivities] = useState([]);

    // set location for search on loadup
    useEffect(() => {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ 'address': locationParam }, (results, status) => {
            if (status === 'OK') {
                const location = results[0].geometry.location;
                setLat(location.lat());
                setLng(location.lng());
            } else {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function (position) {
                        const latitude = position.coords.latitude;
                        const longitude = position.coords.longitude;

                        setLat(latitude);
                        setLng(longitude);
                    });
                } else {
                    // if geolocation not supported by browser, default to App Academy
                    setLat(40.7271066);
                    setLng(-73.9947448);
                }
            }
        })
    }, [])

    // Create the initial map ONLY after lat and lng are set after geocoding's successful callback
    useEffect(() => {
        if (lat !== 0 && lng !== 0 && !map) {
            const newMap = new window.google.maps.Map(mapRef.current, {
                center: { lat, lng },
                zoom: 15,
                ...mapOptions,
            });

            newMap.addListener("dragend", () => {
                setLat(newMap.getCenter().lat())
                setLng(newMap.getCenter().lng())
                // listener to set new coordinates for search
                // triggers a useEffect dependent on lng
            });

            setMap(newMap);
        }
    }, [lat, lng]);

    // Run initial search after map is loaded
    useEffect(() => {
        handleTextSearch()
    }, [map])

    // useEffect(() => {
    //     if (generatedMarkers) removeGeneratedMarkers();
    //     let prevActivity = selectedActivities[selectedActivities.length - 1];
    //     if (prevActivity) {
    //         handleTextSearch(null, prevActivity, generateRandomType());
    //     }
    // }, [selectedActivities])

    useEffect(() => {
        if (generatedActivities.length) setMarkers()
    }, [generatedActivities])

    useEffect(() => {
        // redo search when lng is updated due to a dragend event
        if (generatedMarkers) removeGeneratedMarkers();
        handleTextSearch(null, null, type)
    }, [lng])

    // removes all generated markers before generating new searches/markers (in handleTextSearch)
    const removeGeneratedMarkers = () => {
        generatedMarkers.current.forEach(marker => {
            marker.setMap(null);
            marker.setVisible(false);
        })
    };

    // sets NEW generated markers and selected markers
    const setMarkers = () => {
        const bounds = new window.google.maps.LatLngBounds();

        selectedMarkers.current.map((marker, ii) => {
            return marker.setLabel({ text: (ii + 1).toString(), className: 'marker-label' });
        });

        const allMarkers = [...generatedMarkers.current, ...selectedMarkers.current];
        allMarkers.forEach(marker => {
            marker.setMap(map);
            const position = marker.position;
            bounds.extend(position)
        });
        map.fitBounds(bounds);
    };

    const infoWindows = [];
    const icons = {
        blueBlank: {
            icon: "http://maps.google.com/mapfiles/kml/paddle/blu-blank.png"
        },
        blueDot: {
            icon: 'http://maps.google.com/mapfiles/kml/paddle/blu-circle.png'
        },
        blueStar: {
            icon: "http://maps.google.com/mapfiles/kml/paddle/blu-stars.png"
        },
        orangeBlank: {
            icon: "http://maps.google.com/mapfiles/kml/paddle/orange-blank.png"
        },
        orangeDot: {
            icon: "http://maps.google.com/mapfiles/kml/paddle/orange-circle.png"
        },
        orangeStar: {
            icon: "http://maps.google.com/mapfiles/kml/paddle/orange-stars.png"
        }
    };

    const createGeneratedMarker = (place) => {
        const marker = new window.google.maps.Marker({
            // map: map,
            position: place.geometry.location,
            title: place.name,
            icon: icons.orangeBlank.icon
        });
        marker.setAnimation(window.google.maps.Animation.BOUNCE)

        // create infowindow for marker
        const infowindow = new window.google.maps.InfoWindow();
        infowindow.setContent(`
            <div>
                <h3>${marker.title}</h3>
                <a href="${place.url}" target="_blank">Visit Page</a>
            </div>
        `)

        window.google.maps.event.addListener(marker, "click", () => {
            infoWindows.forEach((infoWindow) => {
                infoWindow.close();
            });
            infowindow.open(map, marker);
        });
        infoWindows.push(infowindow);

        generatedMarkers.current.push(marker);
    };

    const createSelectedMarker = (place) => {
        const location = { lat: place.lat, lng: place.lng }
        //  create marker and assign to map
        const marker = new window.google.maps.Marker({
            // map: map,
            position: location,
            title: place.name,
            icon: icons.orangeBlank.icon
        });
        // create infowindow for marker
        const infowindow = new window.google.maps.InfoWindow();
        infowindow.setContent(`
            <div>
                <h3>${marker.title}</h3>
                <a href="${place.url}" target="_blank">Visit Page</a>
            </div>
        `)
        window.google.maps.event.addListener(marker, "click", () => {
            infoWindows.forEach((infoWindow) => {
                infoWindow.close();
            });
            infowindow.open(map, marker);
        });
        infoWindows.push(infowindow);

        // add marker to markers array
        selectedMarkers.current.push(marker);
    }

    const generateRandomType = () => {
        return activityTypes[Math.floor(Math.random() * activityTypes.length)];
    }

    const handleTextSearch = (e, prevActivity, newType, searchRadius) => {
        e?.preventDefault();

        if (generatedActivities.length) { removeGeneratedMarkers() }
        generatedMarkers.current = [];

        // create PlacesService instance using the map
        const service = map ? new window.google.maps.places.PlacesService(map) : null;
        searchRadius = searchRadius || 500;
        const request = {
            keyword: newType ? newType : type,
            location: prevActivity ? { lat: prevActivity.lat, lng: prevActivity.lng } : { lat, lng },
            radius: searchRadius,
        }
        setType(newType || type);

        if (service && lat !== 0 && lng !== 0) {
            setIsLoading(true);
            service.nearbySearch(request, (results, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                    let activities = [];
                    let ii = 0;
                    while (activities.length < number && ii < results.length) {
                        if (results[ii].business_status === 'OPERATIONAL' &&
                            results[ii].name !== prevActivity?.name &&
                            !selectedActivities.some(activity => activity.name === results[ii].name)) {
                            if (results[ii].photos) { // reject if no photos
                                activities.push(results[ii]);
                            }
                        }
                        ii += 1;
                    }

                    if (activities.length !== number) {
                        // expand search radius until enough suggestions are found
                        redoSearch(e, prevActivity, newType, searchRadius)
                    } else {
                        activities.forEach(result => {
                            createGeneratedMarker(result);
                        });

                        let organizedActivities = activities.map((result) => {
                            const activity = {
                                name: result.name,
                                rating: result.rating,
                                location: result.geometry.location,
                                photoUrl: null,
                                price: null,
                                place_id: result.place_id,
                                type: newType ? newType : type
                            }
                            if (result.photos) {
                                activity.photoUrl = result.photos[0].getUrl();
                            }
                            if (result.price_level) {
                                activity.price = result.price_level;
                            }
                            return activity
                        });

                        setGeneratedActivities(organizedActivities);
                        setIsLoading(false);
                        // map.setCenter({lat, lng})
                        // remove all but the selected marker
                    }


                } else {
                    redoSearch(e, prevActivity, newType, searchRadius)
                }
            })
        }
    }

    const redoSearch = (e, prevActivity, newType, searchRadius) => {
        if (searchRadius < 10000) {
            handleTextSearch(e, prevActivity, newType, searchRadius + 500)
        }
    }

    const handleSelectActivity = (activity) => {
        // get more details about the activity using Places API
        const service = new window.google.maps.places.PlacesService(map);
        const request = { placeId: activity.place_id }
        service.getDetails(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                let detailedActivity = {
                    name: results.name,
                    rating: results.rating,
                    streetAddress: results.formatted_address,
                    location: results.geometry.location,
                    lat: results.geometry.location.lat(),
                    lng: results.geometry.location.lng(),
                    url: results.url,
                    type: activity.type
                }

                let photoURLs = [];
                // if (results.photos) {
                //     results.photos.forEach(photo => {
                //         photoURLs.push(photo.getUrl());
                //     })
                // }
                photoURLs.push(results.photos[0].getUrl());
                detailedActivity.photoURLs = photoURLs;
                detailedActivity.photoUrl = photoURLs[0];

                // reset generated activities
                removeGeneratedMarkers();
                setGeneratedActivities([])

                // save activity
                setSelectedActivities(prevSelectedActivities => [...prevSelectedActivities, detailedActivity])
                createSelectedMarker(detailedActivity)

                // move map
                map.setCenter(activity.location)
                // reset coordinates for next activity
                setLat(parseFloat(detailedActivity.lat))
                setLng(parseFloat(detailedActivity.lng))

                // redo search in useEffect listening to change in lng
            }
        })
    }

    const loginModal = (
        <>
            {showModal && (
                <Modal onClose={() => setShowModal(false)}>
                    <LoginForm setShowModal={setShowModal} />
                </Modal>
            )}
        </>
    );

    const handleSaveItinerary = () => {
        const itinerary = {
            title: itineraryTitle,
            activities: [...selectedActivities]
        };

        if (currentUser) {
            dispatch(createItinerary(itinerary))
                .then(itinerary => {
                    history.push(`/itineraries/${itinerary._id}`);
                    dispatch(fetchItinerary(itinerary._id))
                })
        } else {
            setShowModal(true)
        }
    };

    const handleMouseEnter = (activity) => {
        // Find the marker by title
        const marker = generatedMarkers.current.find(marker => marker.title === activity.name);
        if (marker) {
            // Change the marker when the item is hovered over
            marker.setIcon("http://maps.google.com/mapfiles/kml/paddle/orange-circle.png");
            // marker.setAnimation(window.google.maps.Animation.BOUNCE);
        }
    };

    const handleMouseLeave = (activity) => {
        // Find the marker by title
        const marker = generatedMarkers.current.find(marker => marker.title === activity.name);
        if (marker) {
            // Change the marker back to its original state when the mouse leaves the item
            marker.setIcon("http://maps.google.com/mapfiles/kml/paddle/orange-blank.png");
            // marker.setAnimation(null); // Removes the bounce animation
        }
    };

    const activitiesChoiceRow = (
        generatedActivities.map((activity, index) => (
            <div
                className={`activity-generated-item`}
                key={index}
                onClick={() => handleSelectActivity(activity)}
                onMouseEnter={() => handleMouseEnter(activity)}
                onMouseLeave={() => handleMouseLeave(activity)}
            >
                {activity.photoUrl ? <img className="choice-img" src={activity.photoUrl} alt="activity" /> : null}
                <div className="choice-activity-name">{activity.name}</div>
                <div className="activity-place-rating" id="activity-place-rating-modified">

                    {activity.rating === '0' ? <></> : <div className="rating-wrap">{activity.rating}</div>}
                    {Array.from({ length: activity.rating }, (_, index) => (
                        <i key={index} className="create-star-rating-ico"></i>
                    ))}
                    {activity.rating % 1 !== 0 && (
                        <i className="create-star-rating-ico-half"></i>
                    )}


                </div>

            </div>
        ))
    );

    return (
        <>

            {loginModal}

            <div className="section-top">
                <div ref={mapRef} className="itinerary-show-map" id="itinerary-show-map-modified"></div>
                <div className="itinerary-show-details" id="itinerary-show-details-modified">

                    {selectedActivities.length === 0 ? (
                        instructions
                    ) : (
                        selectedActivities.map((activity, index) => {
                            return <ActivityItem activity={activity} key={activity._id} />;
                        })
                    )}
                </div>
            </div>

            <div className="section-bottom">
                <div className="section-left">
                    <div className="create-page-circle" onClick={e => handleTextSearch(null, null, 'Museum', null)}>
                        <i className="fa-solid fa-building-columns fa-2xl"></i>
                    </div>
                    <div className="create-page-circle" onClick={e => handleTextSearch(null, null, 'Bar', null)}>
                        <i className="fa-solid fa-martini-glass fa-2xl"></i>
                    </div>
                    <div className="create-page-circle" onClick={e => handleTextSearch(null, null, 'Park', null)}>
                        <i className="fa-solid fa-tree fa-2xl"></i>
                    </div>
                    <div className="create-page-circle" onClick={e => handleTextSearch(null, null, 'Bowling and Billiards', null)}>
                        <i className="fa-solid fa-bowling-ball fa-2xl"></i>
                    </div>
                    <div className="create-page-circle" onClick={e => handleTextSearch(null, null, 'Movie Theater', null)}>
                        <i className="fa-solid fa-clapperboard fa-2xl"></i>
                    </div>
                    <div className="create-page-circle" onClick={e => handleTextSearch(null, null, 'Cafe', null)}>
                        <i className="fa-solid fa-mug-hot fa-2xl"></i>
                    </div>
                    <div className="create-page-circle" onClick={e => handleTextSearch(null, null, 'Swimming Pool and Ice Skating', null)}>
                        <i className="fa-solid fa-person-swimming fa-2xl"></i>
                    </div>
                    <div className="create-page-circle" onClick={e => handleTextSearch(null, null, 'Restaurant', null)}>
                        <i className="fa-solid fa-utensils fa-2xl"></i>
                    </div>
                </div>



                <div className="section-right">
                    <div className="activity-generated-row">
                        {isLoading ? <LoadingAnimation /> : activitiesChoiceRow}
                    </div>

                    <div className="input-button-capsule-create">
                        <InstructionsModal />
                        <div>
                            <input
                                className="title-input"
                                type="text"
                                placeholder="itinerary name"
                                value={itineraryTitle}
                                onChange={e => setItineraryTitle(e.target.value)}
                            />
                            <button
                                id="nav-button-venture"
                                className="nav-button"
                                onClick={handleSaveItinerary}
                                disabled={(!itineraryTitle || selectedActivities.length === 0) && currentUser }
                            ><i className="fa-solid fa-plus"></i>  <span style={{ marginTop: "1px" }}>itinerate!</span>
                            </button>
                        </div>
                    </div>

                </div>


            </div>
        </>
    )
}

const ItineraryMapWrapper = () => {
    return (
        <Wrapper apiKey={process.env.REACT_APP_MAPS_API_KEY}>
            <ItineraryMap />
        </Wrapper>
    );
}

export default ItineraryMapWrapper;

import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import './UserItineraries.css'
import { useEffect } from "react";
import { fetchUserItineraries } from "../../store/userItineraries";
import { getItineraries } from "../../store/itineraries";
import UserItinerariesItem from "./UserItinerariesItem";
import { selectCurrentUser } from "../../store/session";

const UserItineraries = () => {
    const { userId } = useParams();
    const dispatch = useDispatch();
    
    const currentUser = useSelector(selectCurrentUser);

    useEffect(() => {
        dispatch(fetchUserItineraries(userId));
    }, [dispatch, userId]);

    const userItineraries = useSelector(getItineraries);

    const greetings = () => {
        if (currentUser?._id === userId) {
            return (<div className="user-itineraries-header">My Itineraries</div>)
        } else {
            return (<div className="user-itineraries-header">{userItineraries[0].creator}&nbsp;&nbsp;&nbsp;&nbsp;Itineraries</div>)
        }
    }

    return (
        <>
            <div className="user-itineraries-box">
                {greetings()}
                {userItineraries.map((itinerary => {
                    return <UserItinerariesItem key={itinerary._id} itinerary={itinerary} />
                }))}
            </div>
        </>
    )
}

export default UserItineraries;
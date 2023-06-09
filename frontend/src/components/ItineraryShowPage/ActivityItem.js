
const ActivityItem = ({ activity, handleRemoval }) => {
    const { photoURLs, name, type, createdAt, streetAddress, rating } = activity;

    return (
        <div className="activity-item-wrap">
            <div>
                <img className='activity-photo' src={photoURLs[0]}></img>
            </div>

            <div className="activity-info-holder">
                <div className='activity-place-name'>{name}</div>
                <div className='activity-place-type'>{type}</div>
                <div className='activity-place-address'>{streetAddress}</div>
                <div className="activity-place-rating">
                    {Array.from({ length: rating }, (_, index) => (
                        <i key={index} className="star-rating-ico"></i>
                    ))}
                    {rating % 1 !== 0 && (
                        <i className="star-rating-ico-half"></i>
                    )}
                    {rating}
                </div>
            </div>
            {handleRemoval ?
                    <button className='nav-button remove-activity-button'
                            onClick={() => handleRemoval(activity)}>
                        <i className="fa-solid fa-trash-can"></i>
                    </button>
                    : null}
        </div>
    )
}



export default ActivityItem;

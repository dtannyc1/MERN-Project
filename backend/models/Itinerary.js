const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const activitySchema = new Schema({
        name: {
            type: String,
            required: true
        },
        lat: {
            type: Number,
            required: true
        },
        lng: Number,
        type: String,
        duration: Number
    }, {
        timestamps: true
});

const itinerarySchema = new Schema({
        username: { // creator
            type: String,
            required: true
        },
        userId: { // creator id
            type: ObjectId,
            required: true
        },
        activities: [activitySchema] // array of activities
    }, {
        timestamps: true
});

module.exports = mongoose.model('Itinerary', itinerarySchema);

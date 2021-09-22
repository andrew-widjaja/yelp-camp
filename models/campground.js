const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review')

//Separate out ImageSchema from CampgroundSchema because we want to use virtual property on it
const ImageSchema = new Schema({
    url: String,
    filename: String
})
//Using virtual property makes it so that we don't have to store this new url
ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200')
})

//This code allows use of geoJSON in virtual properties. Pass opts into the schema
const opts = { toJSON: { virtuals: true } };

const CampgroundSchema = new Schema({
    title: String,
    images: [ImageSchema],
    geometry: {
        type: {
            type: String, // Don't do `{ location: { type: String } }`
            enum: ['Point'], // 'location.type' must be 'Point'
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    price: Number,
    description: String,
    location: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
}, opts);

//Create a virtual property that is going to include the markup for a cluster popup (see clusterMap.js)
CampgroundSchema.virtual('properties.popUpMarkup').get(function () {
    return `
    <strong><a href="/campgrounds/${this._id}">${this.title}</a></strong>
    <p>${this.description.substring(0, 150)}...</p>`
})

//Set up query middleware that passes in the deleted document to the function
//Note: the 'findOneAndDelete' middleware is activated specifically by findByIdAndDelete. If we used a different delete method, such as 'remove' then we need to use a different middleware.
CampgroundSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        //Delete all reviews where its id field is in the reviews array of the document that was just deleted
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
})

module.exports = mongoose.model('Campground', CampgroundSchema)
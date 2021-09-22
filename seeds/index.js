const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Campground = require('../models/campground')

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';
mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const sample = (array) => array[Math.floor(Math.random() * array.length)]

const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 300; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10
        const camp = new Campground({
            //YOUR USER ID
            author: '61384096d83d9972e44275d6',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Libero inventore animi in quidem eaque earum vero voluptatibus, molestias soluta, culpa nostrum quos iste dolore minima commodi ex eligendi aspernatur porro. Aspernatur magni tempora eum, nulla corrupti sit esse, quam quod vero explicabo eaque officia molestias obcaecati fuga corporis expedita libero commodi totam? Id, animi quos? Itaque praesentium recusandae voluptatum repellendus? Earum necessitatibus repudiandae architecto sapiente saepe accusantium sunt voluptas repellendus quasi. Debitis consequuntur nihil recusandae, consequatur accusamus placeat sequi asperiores unde. Nobis fuga sed impedit. Dolorem asperiores corrupti excepturi est.',
            price: price,
            geometry: {
                type: 'Point',
                coordinates: [ //Set the coordinates to be the same as the random city generated from cities.js
                    cities[random1000].longitude,
                    cities[random1000].latitude
                ]
            },
            images: [
                {
                    url: 'https://res.cloudinary.com/dnobl8sah/image/upload/v1631811175/YelpCamp/te7ox5hhcnseoinozaiq.jpg',
                    filename: 'YelpCamp/te7ox5hhcnseoinozaiq',
                },
                {
                    url: 'https://res.cloudinary.com/dnobl8sah/image/upload/v1631811175/YelpCamp/cutxq9lmi6t3pvdvjcl8.jpg',
                    filename: 'YelpCamp/cutxq9lmi6t3pvdvjcl8',
                },
            ]
        });
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})
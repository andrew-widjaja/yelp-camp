const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const Campground = require('../models/campground');
const { isLoggedIn, isAuthor, validateCampground } = require('../middleware');
//A campgrounds controller was created to shorten the routes:
const campgrounds = require('../controllers/campgrounds');
//Using Multer and Cloudinary
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

router.route('/')
    //Set up route to campgrounds index (index.ejs)
    .get(catchAsync(campgrounds.index))

    //Set up POST route to add the new campground
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.createCampground))

//Set up route to render a CREATE form for a campground (new.ejs)
router.get('/new', isLoggedIn, campgrounds.renderNewForm);

router.route('/:id')
    //Set up route to SHOW campground details page (show.ejs)
    .get(catchAsync(campgrounds.showCampground))
    //Set up method override route to update campground info and then redirect
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync(campgrounds.updateCampground))
    //Set up DELETE route and redirect
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground));

//Set up route to render the UPDATE form for a campground (edit.ejs)
router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm));

module.exports = router;



const express = require('express');
const router = express.Router({ mergeParams: true });
const Campground = require('../models/campground');
const Review = require('../models/review');
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const { validateReview, isLoggedIn, isReviewAuthor } = require('../middleware');
//A reviews controller was created to shorten the routes:
const reviews = require('../controllers/reviews');

//Set up route to a save a campground's reviews
router.post('/', isLoggedIn, validateReview, catchAsync(reviews.createReview));

//Set up DELETE route for an individual campground's review
router.delete('/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(reviews.deleteReview));

module.exports = router;


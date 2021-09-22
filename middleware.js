const ExpressError = require('./utils/ExpressError');
const { campgroundSchema, reviewSchema } = require('./schemas');
const Campground = require('./models/campground');
const Review = require('./models/review');

//Create an isLoggedIn middleware to check if a user is logged in. Use req.isAuthenticated() method from Passport to authenticate before creation of new campground
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        //Store the url we want to go back to as returnTo in our session
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in first.');
        return res.redirect('/login');
    }
    next();
}

//Set up JOI validation middleware to use for edit and new submissions
module.exports.validateCampground = (req, res, next) => {
    //This is going to validate our data before we even attempt to save it to Mongoose
    //campgroundSchema is exported from the schemas.js file
    //This will throw the new error using ExpressError handler and display the msg
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

//Authorization middleware for campgrounds
module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params
    const campground = await Campground.findById(id);
    if (!campground.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
}

//Authorization middleware for reviews
module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params
    const review = await Review.findById(reviewId);
    if (!review.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
}

//Review validation middleware
module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}
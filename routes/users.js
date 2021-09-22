const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync')
const User = require('../models/user');
const passport = require('passport');
const users = require('../controllers/users');

router.route('/register')
    //Create registration form GET route
    .get(users.renderRegister)
    //Creates a new user with the information using Passport
    .post(catchAsync(users.register));

router.route('/login')
    //Create login form GET route
    .get(users.renderLogin)
    //Use passport.authenticate() method to log in
    .post(passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), users.login);

router.get('/logout', users.logout)

module.exports = router;


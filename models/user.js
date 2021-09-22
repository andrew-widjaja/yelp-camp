const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
});

//This adds a username and password on to our schema, and gives us additional methods to use ( i.e. authenticate(), serializeUser(), deserializeUser(), register(), etc )
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);


//IF we run in development mode, require the dotenv document which will take the variables in our .env file and add them into process.env.
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const ExpressError = require("./utils/ExpressError");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const helmet = require("helmet");

const mongoSanitize = require("express-mongo-sanitize");

//Require the campgrounds.js, reviews.js, users.js routes files
const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");
const userRoutes = require("./routes/users");

const MongoStore = require("connect-mongo");

//Use this database when we deploy, using the local DB as our backup
const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/yelp-camp";

mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

const app = express();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//Middleware to parse data and method-override
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
//Use of public directory
app.use(express.static(path.join(__dirname, "public")));
app.use(
  mongoSanitize({
    replaceWith: "_",
  })
);

const secret = process.env.SECRET || "thisisthesecret";

const store = MongoStore.create({
  mongoUrl: dbUrl,
  secret,
  touchAfter: 24 * 60 * 60,
});

store.on("erro", function (e) {
  console.log("SESSION STORE ERROR", e);
});

//Setting up express-session
const sessionConfig = {
  store,
  name: "session",
  secret,
  resave: false, //Gets rid of the deprecation warning
  saveUninitialized: true, //Gets rid of the deprecation warning
  cookie: {
    httpOnly: true, //Adds some security
    // secure: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, //Set expiration date
    maxAge: 1000 * 60 * 60 * 24 * 7, //Set max age of the cookie
  },
};
app.use(session(sessionConfig));
app.use(flash());
app.use(helmet());

const scriptSrcUrls = [
  "https://api.tiles.mapbox.com",
  "https://api.mapbox.com",
  "https://kit.fontawesome.com",
  "https://cdnjs.cloudflare.com",
  "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
  "https://kit-free.fontawesome.com",
  "https://stackpath.bootstrapcdn.com",
  "https://api.mapbox.com",
  "https://api.tiles.mapbox.com",
  "https://fonts.googleapis.com",
  "https://use.fontawesome.com",
  "https://cdn.jsdelivr.net",
];
const connectSrcUrls = [
  "https://api.mapbox.com",
  "https://*.tiles.mapbox.com",
  "https://events.mapbox.com",
];
const fontSrcUrls = [];
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["blob:"],
      objectSrc: [],
      imgSrc: [
        "'self'",
        "blob:",
        "data:",
        "https://res.cloudinary.com/dnobl8sah/",
        "https://images.unsplash.com",
      ],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })
);

//Middleware to use Passport
app.use(passport.initialize());
app.use(passport.session());
//Tells passport to use the LocalStrategy and authenticate our User model
passport.use(new LocalStrategy(User.authenticate()));
//Tells passport how to store a user in the session
passport.serializeUser(User.serializeUser());
//Tells passport how to remove a user from the session
passport.deserializeUser(User.deserializeUser());

//Set up middleware to get access to flash message
app.use((req, res, next) => {
  //req.user is created by Passport when a user is logged in
  res.locals.currentUser = req.user;
  //flash middleware
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

//DELETE THIS LATER
// //Set up route to register a user using User.register() method from Passport
// app.get('/fakeUser', async (req, res) => {
//     const user = new User({ email: 'andrew@gmail.com', username: 'andrew' });
//     //This methods takes in a user model and a password. It will hash and store it.
//     const newUser = await User.register(user, 'chicken');
//     res.send(newUser);
// })

//Set up router defaults
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);
app.use("/", userRoutes);

app.get("/", (req, res) => {
  res.render("home");
});

//This must be placed near the end so that it only runs if no route handler is executed above.
app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

//Set up our custom "catch-all" error handler that will be triggered by any next(e)
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Oh no, something went wrong!";
  res.status(statusCode).render("error", { err });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Serving on port ${port}`);
});

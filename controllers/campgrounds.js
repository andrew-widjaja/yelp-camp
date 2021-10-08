const Campground = require("../models/campground");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const { cloudinary } = require("../cloudinary");

module.exports.index = async (req, res) => {
  const campgrounds = await Campground.find({});
  res.render("campgrounds/index", { campgrounds });
};

module.exports.renderNewForm = (req, res) => {
  res.render("campgrounds/new");
};

module.exports.createCampground = async (req, res, next) => {
  const geoData = await geocoder
    .forwardGeocode({
      query: req.body.campground.location,
      limit: 1,
    })
    .send();

  const campground = new Campground(req.body.campground);
  //Add coordinate data of the new campground location to 'campground.geometry'
  campground.geometry = geoData.body.features[0].geometry;
  //Make an array that contains the url and filename of the uploaded images and adds them to the campground.images model properties
  campground.images = req.files.map((f) => ({
    url: f.path,
    filename: f.filename,
  }));
  //Add user id to campground.author to associate the created campground with the user
  campground.author = req.user._id;
  await campground.save();
  console.log(campground);

  //Flash message and redirect to new campground show page
  req.flash(
    "success",
    `Successfully created the ${campground.title} campground!`
  );
  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.showCampground = async (req, res) => {
  const campground = await Campground.findById(req.params.id)
    .populate({
      //Nested populate that will populate the reviews, the authors of the reviews, then the author of the campground itself
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("author");
  if (!campground) {
    req.flash("error", "Sorry, could not find that campground...");
    return res.redirect("/campgrounds");
  }
  res.render("campgrounds/show", { campground });
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);
  if (!campground) {
    req.flash("error", "Sorry, could not find that campground...");
    return res.redirect("/campgrounds");
  }
  res.render("campgrounds/edit", { campground });
};

module.exports.updateCampground = async (req, res) => {
  const { id } = req.params;
  const campground = await Campground.findByIdAndUpdate(id, {
    ...req.body.campground,
  });
  //This code allows you to upload new images on the edit page
  const imgs = req.files.map((f) => ({ url: f.path, filename: f.filename }));
  campground.images.push(...imgs);
  await campground.save();
  //Deleting images from the Edit form
  if (req.body.deleteImages) {
    //This for loop will remove the images from the Cloudinary storage
    for (let filename of req.body.deleteImages) {
      await cloudinary.uploader.destroy(filename);
    }
    //Query to pick out images and removing it from Mongo
    await campground.updateOne({
      $pull: { images: { filename: { $in: req.body.deleteImages } } },
    });
  }
  req.flash(
    "success",
    `Successfully updated the ${campground.title} campground.`
  );
  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.deleteCampground = async (req, res) => {
  const { id } = req.params;
  const campground = await Campground.findByIdAndDelete(id);
  req.flash(
    "success",
    `Successfully deleted the ${campground.title} campground.`
  );
  res.redirect("/campgrounds");
};

const Listing = require("../models/listing");
const ExpressError = require("../utils/ExpressError");
const opencage = require("opencage-api-client");

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
  let geojsonPoint ;

  try {
    const data = await opencage.geocode({ q: req.body.listing.location });

    if (data.status.code === 200 && data.results.length > 0) {
      const place = data.results[0];

      geojsonPoint = {
        type: "Point",
        coordinates: [place.geometry.lng, place.geometry.lat],
      };
    } else {
      console.log("Status:", data.status.message);
      console.log("Total Results:", data.total_results);
    }
  } catch (error) {
    console.log("Error:", error.message);
    if (error.status?.code === 402) {
      console.log("Hit free trial daily limit");
    }
  }

  let url = req.file.path || req.file.url;
  let filename = req.file.filename || req.file.public_id;

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { filename, url };
  newListing.geometry = geojsonPoint;

  let saveListing = await newListing.save();
  console.log(saveListing);
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  if (!req.body.listing) throw new ExpressError(400, "Invalid Listing Data");
  const { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if (typeof req.file !== "undefined") {
    let url = req.file.path || req.file.url; // Cloudinary gives `url`
    let filename = req.file.filename || req.file.public_id; // Cloudinary gives `public_id`
    listing.image = { filename, url };
    await listing.save();
  }
  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  console.log("Listing deleted successfully");
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};

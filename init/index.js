const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

main()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

async function main() {
  await mongoose.connect("mongodb://localhost:27017/wanderlust");
}

const initDB = async () => {
  await Listing.deleteMany({});
  initData.data = initData.data.map((obj) => ({
    ...obj,
    owner: "68ce46e5ba53166da363a771",
  }));
  await Listing.insertMany(initData.data);
  console.log("Database initialized");
};

initDB();

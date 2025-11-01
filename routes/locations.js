const express = require("express");
const router = express.Router();
const {
  getLocations,
  addLocation,
  deleteLocation,
} = require("../controller/locations");
const { protect } = require("../controller/login");

router.get("/locations", getLocations);
router.post("/location", protect, addLocation);
router.delete("/location/:id", protect, deleteLocation);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  getLatestWeather,
  getHourlyWeather,
  getDailyWeather,
  triggerBackfill,
} = require("../controller/weather");
const { protect } = require("../controller/login");

router.get("/weather/latest", getLatestWeather);
router.get("/weather/hourly", getHourlyWeather);
router.get("/weather/daily", getDailyWeather);

router.post("/weather/backfill", protect, triggerBackfill);

module.exports = router;

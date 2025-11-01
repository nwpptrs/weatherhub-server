const cron = require("node-cron");
const weatherController = require("../controller/weather");

cron.schedule("0 * * * *", () => {
  console.log("Running hourly weather fetch and daily aggregation cron job...");
  weatherController.getLatestWeatherCron();
});

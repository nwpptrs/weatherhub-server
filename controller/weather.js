const weatherService = require("../services/weatherService");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class WeatherController {
  //ดึงข้อมูลล่าสุด
  async getLatestWeather(req, res) {
    try {
      const locationId = parseInt(req.query.location_id);
      if (!locationId) {
        return res.status(400).json({ error: "location_id required" });
      }

      const result = await weatherService.getLatestWeather(locationId);

      res.json({
        data: {
          ...result.data,
        },
      });
    } catch (err) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  //ดึงข้อมูลย้อนหลัง 3 วัน
  async triggerBackfill(req, res) {
    try {
      const locationId = parseInt(req.query.location_id);
      const days =
        parseInt(req.query.days) || weatherService.DEFAULT_USER_BACKFILL_DAYS;

      if (!locationId) {
        return res.status(400).json({ error: "location_id required" });
      }

      const location = await prisma.location.findUnique({
        where: { id: locationId },
      });

      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }

      const savedCount = await weatherService.fetchAndSaveHourlyData(
        location,
        days
      );
      await weatherService.aggregateDailyWeather(locationId);

      res.json({
        message: `Backfill successful for ${location.name} (${days} days)`,
        saved_hourly_records: savedCount,
        aggregated_daily: true,
      });
    } catch (err) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  //ดึงข้อมูลรายชั่วโมง
  async getHourlyWeather(req, res) {
    try {
      const locationId = parseInt(req.query.location_id);
      if (!locationId) {
        return res.status(400).json({ error: "location_id required" });
      }

      const result = await weatherService.getHourlyWeather(locationId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  //ดึงข้อมูลรายวัน
  async getDailyWeather(req, res) {
    try {
      const locationId = parseInt(req.query.location_id);
      if (!locationId) {
        return res.status(400).json({ error: "location_id required" });
      }

      const result = await weatherService.getDailyWeather(locationId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getLatestWeatherCron() {
    try {
      const locations = await prisma.location.findMany();
      console.log(`ตรวจพบ ${locations.length} เมืองที่ต้องอัพเดทข้อมูล`);

      for (const location of locations) {
        try {
          console.log(`กำลังอัพเดทข้อมูล ${location.name}...`);

          const savedCount = await weatherService.fetchAndSaveHourlyData(
            location,
            7
          );

          console.log(
            `✅ CRON: Updated ${savedCount} records for ${location.name}`
          );

          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (err) {
          console.error(`❌ Error updating ${location.name}:`, err);
        }
      }

      console.log("Aggregating daily weather data...");
      await weatherService.aggregateDailyWeather();

      console.log(
        "✅ อัพเดทสภาพอากาศอัตโนมัติเสร็จสิ้น:",
        new Date().toLocaleString()
      );
    } catch (err) {
      console.error("❌ Cron job error:", err);
      throw err;
    }
  }
}

module.exports = new WeatherController();

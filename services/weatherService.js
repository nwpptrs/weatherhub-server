const prisma = require("../config/prisma");
const axios = require("axios");

const CONFIG = {
  MAX_AGE_HOURS: 3,
  DEFAULT_CRON_BACKFILL_DAYS: 7,
  DEFAULT_USER_BACKFILL_DAYS: 3,
  DEFAULT_TIMEZONE: "Asia/Bangkok",
  MAX_BACKFILL_DAYS: 90,
};

class WeatherService {
  async fetchAndSaveHourlyData(location, totalDays) {
    const timezone = location.timezone || CONFIG.DEFAULT_TIMEZONE;
    const apiPastDays = Math.max(0, totalDays - 1);

    const apiUrl = this._buildApiUrl(location, apiPastDays, timezone);
    const { data } = await axios.get(apiUrl);

    return await this._processAndSaveHourlyData(data.hourly, location.id);
  }

  async getLatestWeather(locationId) {
    const location = await this._validateLocation(locationId);

    const latest = await this._getLatestWeatherRecord(location.id);

    if (this._needsUpdate(latest)) {
      await this.fetchAndSaveHourlyData(
        location,
        CONFIG.DEFAULT_CRON_BACKFILL_DAYS
      );
    }

    const updatedLatest = await this._getLatestWeatherRecord(location.id);
    if (!updatedLatest) {
      throw new Error("No weather data available");
    }

    await this.aggregateDailyWeather(location.id);

    return {
      data: {
        ...updatedLatest,
        timestamp: updatedLatest.timestamp.toISOString(),
      },
    };
  }

  async getHourlyWeather(locationId) {
    const location = await this._validateLocation(locationId);
    await this.getLatestWeather(locationId);

    const { startDate, endDate } = this._calculateTimeRange(
      location.timezone,
      7
    );

    const records = await prisma.weatherHourly.findMany({
      where: {
        location_id: locationId,
        timestamp: { gte: startDate, lte: endDate },
      },
      orderBy: { timestamp: "asc" },
    });

    return this._formatHourlyResponse(records);
  }

  async getDailyWeather(locationId) {
    const location = await this._validateLocation(locationId);
    await this.aggregateDailyWeather(locationId);

    const { startDate, endDate } = this._calculateTimeRange(
      location.timezone,
      7
    );

    const data = await prisma.weatherDaily.findMany({
      where: {
        location_id: locationId,
        date: { gte: startDate, lt: endDate },
      },
      orderBy: { date: "asc" },
      select: {
        date: true,
        temp_max: true,
        temp_min: true,
        rain_sum: true,
      },
    });

    return this._formatDailyResponse(data);
  }

  async aggregateDailyWeather(locationId = null) {
    const locations = await this._getLocationsForAggregation(locationId);

    await Promise.all(
      locations.map((location) => this._aggregateLocationData(location))
    );
  }

  _buildApiUrl(location, pastDays, timezone) {
    return `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&hourly=temperature_2m,relative_humidity_2m,windspeed_10m,precipitation,weathercode&past_days=${pastDays}&timezone=${timezone}`;
  }

  async _processAndSaveHourlyData(hourlyData, locationId) {
    const {
      time: timeList,
      temperature_2m: tempList,
      relative_humidity_2m: humList,
      windspeed_10m: windList,
      precipitation: rainList,
      weathercode: codeList,
    } = hourlyData;

    const currentTime = Date.now();
    const upsertPromises = [];

    for (let i = 0; i < timeList.length; i++) {
      const timestamp = new Date(timeList[i]);
      if (timestamp.getTime() > currentTime) continue;

      upsertPromises.push(
        prisma.weatherHourly.upsert({
          where: {
            location_id_timestamp: {
              location_id: locationId,
              timestamp,
            },
          },
          update: {
            temperature: tempList[i],
            humidity: humList[i],
            windspeed: windList[i],
            rain: rainList[i],
            condition: codeList[i],
          },
          create: {
            location_id: locationId,
            timestamp,
            temperature: tempList[i],
            humidity: humList[i],
            windspeed: windList[i],
            rain: rainList[i],
            condition: codeList[i],
          },
        })
      );
    }

    await Promise.all(upsertPromises);
    return upsertPromises.length;
  }

  async _validateLocation(locationId) {
    const location = await prisma.location.findUnique({
      where: { id: parseInt(locationId) },
    });

    if (!location) throw new Error("Location not found");
    return location;
  }

  async _getLatestWeatherRecord(locationId) {
    return prisma.weatherHourly.findFirst({
      where: { location_id: locationId },
      orderBy: { timestamp: "desc" },
    });
  }

  _needsUpdate(record) {
    if (!record) return true;
    const ageHours =
      (Date.now() - record.timestamp.getTime()) / (1000 * 60 * 60);
    return ageHours >= CONFIG.MAX_AGE_HOURS;
  }

  _calculateTimeRange(timezone, days) {
    const now = new Date();
    const endHour = new Date(now);
    endHour.setMinutes(0, 0, 0);

    const startDate = new Date(
      now.getTime() - (days - 1) * 24 * 60 * 60 * 1000
    );
    const datePart = startDate
      .toLocaleString("sv-SE", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .split(" ")[0];

    return {
      startDate: new Date(`${datePart}T00:00:00+07:00`),
      endDate: endHour,
    };
  }

  _formatHourlyResponse(records) {
    const maxRecords = 7 * 24 + 1;
    const finalRecords =
      records.length > maxRecords
        ? records.slice(records.length - maxRecords)
        : records;

    return {
      time: finalRecords.map((r) => r.timestamp.toISOString()),
      temperature_2m: finalRecords.map((r) => r.temperature),
      relative_humidity_2m: finalRecords.map((r) => r.humidity),
      windspeed_10m: finalRecords.map((r) => r.windspeed),
      precipitation: finalRecords.map((r) => r.rain),
    };
  }

  _formatDailyResponse(data) {
    if (data.length === 0) {
      return {
        time: [],
        temperature_max: [],
        temperature_min: [],
        precipitation_sum: [],
      };
    }

    return {
      time: data.map((d) => this._formatDate(d.date)),
      temperature_max: data.map((d) => d.temp_max),
      temperature_min: data.map((d) => d.temp_min),
      precipitation_sum: data.map((d) => d.rain_sum),
    };
  }

  _formatDate(date) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  async _getLocationsForAggregation(locationId) {
    if (locationId) {
      const location = await this._validateLocation(locationId);
      return location ? [location] : [];
    }
    return prisma.location.findMany();
  }

  async _aggregateLocationData(location) {
    const hourlyData = await prisma.weatherHourly.findMany({
      where: { location_id: location.id },
      orderBy: { timestamp: "asc" },
    });

    if (!hourlyData.length) return;

    const grouped = this._groupHourlyByDay(hourlyData, location.timezone);
    await this._saveDailyAggregates(grouped, location.id);
  }

  _groupHourlyByDay(hourlyData, timezone) {
    const grouped = {};

    for (const record of hourlyData) {
      const dateKey = record.timestamp
        .toLocaleString("sv-SE", {
          timeZone: timezone || CONFIG.DEFAULT_TIMEZONE,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
        .split(" ")[0];

      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(record);
    }

    return grouped;
  }

  async _saveDailyAggregates(grouped, locationId) {
    const dailyPromises = Object.entries(grouped).map(([date, records]) => {
      const temperatures = records
        .map((r) => r.temperature)
        .filter((t) => typeof t === "number" && !isNaN(t));

      const tempMax =
        temperatures.length > 0 ? Math.max(...temperatures) : null;
      const tempMin =
        temperatures.length > 0 ? Math.min(...temperatures) : null;
      const rainSum = records.reduce((sum, r) => sum + (r.rain || 0), 0);

      return prisma.weatherDaily.upsert({
        where: {
          location_id_date: {
            location_id: locationId,
            date: new Date(`${date}T00:00:00Z`),
          },
        },
        update: { temp_max: tempMax, temp_min: tempMin, rain_sum: rainSum },
        create: {
          location_id: locationId,
          date: new Date(`${date}T00:00:00Z`),
          temp_max: tempMax,
          temp_min: tempMin,
          rain_sum: rainSum,
        },
      });
    });

    await Promise.all(dailyPromises);
  }
}

module.exports = new WeatherService();

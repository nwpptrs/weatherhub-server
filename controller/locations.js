const prisma = require("../config/prisma");

exports.getLocations = async (req, res) => {
  try {
    const locations = await prisma.location.findMany();
    res.status(200).json(locations);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.addLocation = async (req, res) => {
  try {
    const { name, lat, lon, timezone } = req.body;

    if (!name || !lat || !lon || !timezone) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const location = await prisma.location.create({
      data: { name, lat: parseFloat(lat), lon: parseFloat(lon), timezone },
    });

    res.status(201).json({ success: true, location });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.deleteLocation = async (req, res) => {
  try {
    const locationId = parseInt(req.params.id);
    if (isNaN(locationId))
      return res.status(400).json({ error: "Invalid location ID" });

    // ลบ hourly ของ location
    await prisma.weatherHourly.deleteMany({
      where: { location_id: locationId },
    });

    // ลบ daily ของ location
    await prisma.weatherDaily.deleteMany({
      where: { location_id: locationId },
    });

    // ลบ location
    await prisma.location.delete({ where: { id: locationId } });

    res.json({ success: true, message: "Location and related data deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

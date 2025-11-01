const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { readdirSync } = require("fs");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

readdirSync("./routes").forEach((item) =>
  app.use("/api", require("./routes/" + item))
);

readdirSync("./cron").forEach((item) => require("./cron/" + item));

app.listen(port, () => console.log(`Server is running on port ${port}`));

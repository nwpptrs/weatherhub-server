/*
  Warnings:

  - A unique constraint covering the columns `[location_id,date]` on the table `WeatherDaily` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[location_id,timestamp]` on the table `WeatherHourly` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "WeatherDaily_location_id_date_key" ON "WeatherDaily"("location_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherHourly_location_id_timestamp_key" ON "WeatherHourly"("location_id", "timestamp");

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "timezone" TEXT NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherHourly" (
    "id" SERIAL NOT NULL,
    "locationId" INTEGER NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "temperature" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "windspeed" DOUBLE PRECISION,
    "precipitation" DOUBLE PRECISION,
    "weathercode" INTEGER,

    CONSTRAINT "WeatherHourly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherDaily" (
    "id" SERIAL NOT NULL,
    "locationId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "temp_max" DOUBLE PRECISION,
    "temp_min" DOUBLE PRECISION,
    "rain_total" DOUBLE PRECISION,

    CONSTRAINT "WeatherDaily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeatherHourly_locationId_time_key" ON "WeatherHourly"("locationId", "time");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherDaily_locationId_date_key" ON "WeatherDaily"("locationId", "date");

-- AddForeignKey
ALTER TABLE "WeatherHourly" ADD CONSTRAINT "WeatherHourly_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherDaily" ADD CONSTRAINT "WeatherDaily_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

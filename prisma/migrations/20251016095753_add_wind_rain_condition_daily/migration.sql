/*
  Warnings:

  - You are about to drop the column `locationId` on the `WeatherDaily` table. All the data in the column will be lost.
  - You are about to drop the column `rain_total` on the `WeatherDaily` table. All the data in the column will be lost.
  - You are about to drop the column `locationId` on the `WeatherHourly` table. All the data in the column will be lost.
  - You are about to drop the column `precipitation` on the `WeatherHourly` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `WeatherHourly` table. All the data in the column will be lost.
  - You are about to drop the column `weathercode` on the `WeatherHourly` table. All the data in the column will be lost.
  - Added the required column `location_id` to the `WeatherDaily` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rain_sum` to the `WeatherDaily` table without a default value. This is not possible if the table is not empty.
  - Made the column `temp_max` on table `WeatherDaily` required. This step will fail if there are existing NULL values in that column.
  - Made the column `temp_min` on table `WeatherDaily` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `location_id` to the `WeatherHourly` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timestamp` to the `WeatherHourly` table without a default value. This is not possible if the table is not empty.
  - Made the column `temperature` on table `WeatherHourly` required. This step will fail if there are existing NULL values in that column.
  - Made the column `humidity` on table `WeatherHourly` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."WeatherDaily" DROP CONSTRAINT "WeatherDaily_locationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."WeatherHourly" DROP CONSTRAINT "WeatherHourly_locationId_fkey";

-- DropIndex
DROP INDEX "public"."Location_name_key";

-- DropIndex
DROP INDEX "public"."WeatherDaily_locationId_date_key";

-- DropIndex
DROP INDEX "public"."WeatherHourly_locationId_time_key";

-- AlterTable
ALTER TABLE "WeatherDaily" DROP COLUMN "locationId",
DROP COLUMN "rain_total",
ADD COLUMN     "location_id" INTEGER NOT NULL,
ADD COLUMN     "rain_sum" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "temp_max" SET NOT NULL,
ALTER COLUMN "temp_min" SET NOT NULL;

-- AlterTable
ALTER TABLE "WeatherHourly" DROP COLUMN "locationId",
DROP COLUMN "precipitation",
DROP COLUMN "time",
DROP COLUMN "weathercode",
ADD COLUMN     "condition" INTEGER,
ADD COLUMN     "location_id" INTEGER NOT NULL,
ADD COLUMN     "rain" DOUBLE PRECISION,
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "temperature" SET NOT NULL,
ALTER COLUMN "humidity" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "WeatherHourly" ADD CONSTRAINT "WeatherHourly_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherDaily" ADD CONSTRAINT "WeatherDaily_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable Resident: rotatable ID card / gate scan token
ALTER TABLE "Resident" ADD COLUMN "residentScanToken" TEXT;

UPDATE "Resident" SET "residentScanToken" = gen_random_uuid()::text WHERE "residentScanToken" IS NULL;

ALTER TABLE "Resident" ALTER COLUMN "residentScanToken" SET NOT NULL;

CREATE UNIQUE INDEX "Resident_residentScanToken_key" ON "Resident"("residentScanToken");

CREATE INDEX "Resident_residentScanToken_idx" ON "Resident"("residentScanToken");

-- AlterTable ScanLog: optional vehicle, optional resident (resident gate scans)
ALTER TABLE "ScanLog" DROP CONSTRAINT "ScanLog_vehicleId_fkey";

ALTER TABLE "ScanLog" ALTER COLUMN "vehicleId" DROP NOT NULL;

ALTER TABLE "ScanLog" ADD CONSTRAINT "ScanLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ScanLog" ADD COLUMN "residentId" TEXT;

ALTER TABLE "ScanLog" ADD CONSTRAINT "ScanLog_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ScanLog_residentId_idx" ON "ScanLog"("residentId");

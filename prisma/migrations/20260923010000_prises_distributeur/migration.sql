
-- DropForeignKey
ALTER TABLE `PrisePlanifiee` DROP FOREIGN KEY `PrisePlanifiee_ligneId_fkey`;

-- DropIndex
DROP INDEX `PrisePlanifiee_ligneId_fkey` ON `PrisePlanifiee`;

-- AlterTable
ALTER TABLE `PrisePlanifiee` DROP COLUMN `ligneId`,
    ADD COLUMN `datePrise` DATETIME(3) NULL,
    ADD COLUMN `medicamentId` VARCHAR(191) NOT NULL,
    ADD COLUMN `prescriptionId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `PrisePlanifiee_prescriptionId_medicamentId_dateHeurePrevue_key` ON `PrisePlanifiee`(`prescriptionId`, `medicamentId`, `dateHeurePrevue`);

-- AddForeignKey
ALTER TABLE `PrisePlanifiee` ADD CONSTRAINT `PrisePlanifiee_prescriptionId_fkey` FOREIGN KEY (`prescriptionId`) REFERENCES `Prescription`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PrisePlanifiee` ADD CONSTRAINT `PrisePlanifiee_medicamentId_fkey` FOREIGN KEY (`medicamentId`) REFERENCES `Medicament`(`codeCis`) ON DELETE RESTRICT ON UPDATE CASCADE;


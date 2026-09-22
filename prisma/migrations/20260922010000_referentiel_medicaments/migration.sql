-- DropForeignKey
ALTER TABLE `LignePrescription` DROP FOREIGN KEY `LignePrescription_medicamentId_fkey`;

-- DropIndex
DROP INDEX `LignePrescription_medicamentId_fkey` ON `LignePrescription`;

-- DropIndex
DROP INDEX `Medicament_nom_dosageUnitaire_key` ON `Medicament`;

-- AlterTable
ALTER TABLE `LignePrescription` ADD COLUMN `quantite` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Medicament` DROP PRIMARY KEY,
    DROP COLUMN `dosageUnitaire`,
    DROP COLUMN `id`,
    DROP COLUMN `nom`,
    ADD COLUMN `codeCis` VARCHAR(191) NOT NULL,
    ADD COLUMN `denomination` VARCHAR(191) NOT NULL,
    ADD COLUMN `formePharmaceutique` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`codeCis`);

-- CreateIndex
CREATE INDEX `Medicament_denomination_idx` ON `Medicament`(`denomination`);

-- AddForeignKey
ALTER TABLE `LignePrescription` ADD CONSTRAINT `LignePrescription_medicamentId_fkey` FOREIGN KEY (`medicamentId`) REFERENCES `Medicament`(`codeCis`) ON DELETE RESTRICT ON UPDATE CASCADE;


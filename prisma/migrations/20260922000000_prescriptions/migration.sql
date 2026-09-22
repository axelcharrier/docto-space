-- DropForeignKey
ALTER TABLE `LignePrescription` DROP FOREIGN KEY `LignePrescription_prescriptionId_fkey`;

-- DropForeignKey
ALTER TABLE `Prescription` DROP FOREIGN KEY `Prescription_demandeId_fkey`;

-- DropIndex
DROP INDEX `Prescription_demandeId_fkey` ON `Prescription`;

-- AlterTable
ALTER TABLE `LignePrescription` ADD COLUMN `dureeJours` INTEGER NULL,
    ADD COLUMN `instructions` VARCHAR(191) NULL,
    ADD COLUMN `intervalleHeures` INTEGER NULL,
    ADD COLUMN `moments` TEXT NULL;

-- AlterTable
ALTER TABLE `Notification` MODIFY `type` ENUM('NOUVELLE_DEMANDE', 'DEMANDE_ACCEPTEE', 'DEMANDE_REFUSEE', 'NOUVELLE_PRESCRIPTION', 'PRESCRIPTION_MODIFIEE', 'PRESCRIPTION_SUPPRIMEE') NOT NULL;

-- AlterTable
ALTER TABLE `Prescription` ADD COLUMN `astronauteId` VARCHAR(191) NOT NULL,
    ADD COLUMN `commentaire` TEXT NULL,
    ADD COLUMN `medecinId` VARCHAR(191) NOT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `demandeId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Medicament_nom_dosageUnitaire_key` ON `Medicament`(`nom`, `dosageUnitaire`);

-- CreateIndex
CREATE INDEX `Prescription_astronauteId_idx` ON `Prescription`(`astronauteId`);

-- CreateIndex
CREATE INDEX `Prescription_medecinId_idx` ON `Prescription`(`medecinId`);

-- AddForeignKey
ALTER TABLE `Prescription` ADD CONSTRAINT `Prescription_astronauteId_fkey` FOREIGN KEY (`astronauteId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prescription` ADD CONSTRAINT `Prescription_medecinId_fkey` FOREIGN KEY (`medecinId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prescription` ADD CONSTRAINT `Prescription_demandeId_fkey` FOREIGN KEY (`demandeId`) REFERENCES `DemandeConsultation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LignePrescription` ADD CONSTRAINT `LignePrescription_prescriptionId_fkey` FOREIGN KEY (`prescriptionId`) REFERENCES `Prescription`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RedefineIndex
-- MariaDB supprime l'index de la clé étrangère en même temps que la
-- contrainte (DropForeignKey plus haut), il n'y a donc rien à supprimer
-- ici — contrairement au script généré par `prisma migrate diff`.
CREATE INDEX `LignePrescription_prescriptionId_idx` ON `LignePrescription`(`prescriptionId`);


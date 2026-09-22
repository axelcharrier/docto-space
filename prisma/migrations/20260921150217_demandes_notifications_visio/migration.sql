/*
  Warnings:

  - You are about to drop the column `heureSouhaitee` on the `DemandeConsultation` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `DemandeConsultation` table without a default value. This is not possible if the table is not empty.
  - Made the column `commentaire` on table `DemandeConsultation` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `DemandeConsultation` DROP FOREIGN KEY `DemandeConsultation_medecinId_fkey`;

-- DropIndex
DROP INDEX `DemandeConsultation_medecinId_fkey` ON `DemandeConsultation`;

-- AlterTable
ALTER TABLE `DemandeConsultation` DROP COLUMN `heureSouhaitee`,
    ADD COLUMN `dateConsultation` DATETIME(3) NULL,
    ADD COLUMN `motifRefus` TEXT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    ADD COLUMN `visioRoomId` VARCHAR(191) NULL,
    MODIFY `medecinId` VARCHAR(191) NULL,
    MODIFY `commentaire` TEXT NOT NULL;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('NOUVELLE_DEMANDE', 'DEMANDE_ACCEPTEE', 'DEMANDE_REFUSEE') NOT NULL,
    `titre` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `lienUrl` VARCHAR(191) NULL,
    `lue` BOOLEAN NOT NULL DEFAULT false,
    `demandeId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_lue_idx`(`userId`, `lue`),
    INDEX `Notification_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `DemandeConsultation_statut_idx` ON `DemandeConsultation`(`statut`);

-- AddForeignKey
ALTER TABLE `DemandeConsultation` ADD CONSTRAINT `DemandeConsultation_medecinId_fkey` FOREIGN KEY (`medecinId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_demandeId_fkey` FOREIGN KEY (`demandeId`) REFERENCES `DemandeConsultation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


-- AlterTable
ALTER TABLE `User` ADD COLUMN `rfidUid` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_rfidUid_key` ON `User`(`rfidUid`);


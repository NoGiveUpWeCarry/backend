/*
  Warnings:

  - The primary key for the `Channel` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Channel` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `channel_id` on the `Channel_users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `channel_id` on the `Message` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- DropForeignKey
ALTER TABLE `Channel_users` DROP FOREIGN KEY `Channel_users_channel_id_fkey`;

-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_channel_id_fkey`;

-- DropIndex
DROP INDEX `Channel_users_channel_id_fkey` ON `Channel_users`;

-- DropIndex
DROP INDEX `Message_channel_id_fkey` ON `Message`;

-- AlterTable
ALTER TABLE `Channel` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `Channel_users` MODIFY `channel_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Message` MODIFY `channel_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Channel_users` ADD CONSTRAINT `Channel_users_channel_id_fkey` FOREIGN KEY (`channel_id`) REFERENCES `Channel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_channel_id_fkey` FOREIGN KEY (`channel_id`) REFERENCES `Channel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

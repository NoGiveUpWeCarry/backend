/*
  Warnings:

  - You are about to drop the column `room_id` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the `Room` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Room_users` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `channel_id` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_room_id_fkey`;

-- DropForeignKey
ALTER TABLE `Room_users` DROP FOREIGN KEY `Room_users_room_id_fkey`;

-- DropForeignKey
ALTER TABLE `Room_users` DROP FOREIGN KEY `Room_users_user_id_fkey`;

-- DropIndex
DROP INDEX `Message_room_id_fkey` ON `Message`;

-- AlterTable
ALTER TABLE `Message` DROP COLUMN `room_id`,
    ADD COLUMN `channel_id` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `Room`;

-- DropTable
DROP TABLE `Room_users`;

-- CreateTable
CREATE TABLE `Channel` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT 'default_channel_name',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Channel_users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `channel_id` VARCHAR(191) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Channel_users` ADD CONSTRAINT `Channel_users_channel_id_fkey` FOREIGN KEY (`channel_id`) REFERENCES `Channel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Channel_users` ADD CONSTRAINT `Channel_users_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_channel_id_fkey` FOREIGN KEY (`channel_id`) REFERENCES `Channel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

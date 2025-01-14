-- AlterTable
ALTER TABLE `User` ADD COLUMN `password` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `online_users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `client_id` VARCHAR(191) NOT NULL,
    `user_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

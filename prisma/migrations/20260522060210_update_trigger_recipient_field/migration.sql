/*
  Warnings:

  - Added the required column `recipientField` to the `triggers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "triggers" ADD COLUMN     "recipientField" TEXT NOT NULL;

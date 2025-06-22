/*
  Warnings:

  - The primary key for the `InventoryStock` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `quantity` on the `InventoryStock` table. All the data in the column will be lost.
  - The primary key for the `StockLog` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `quantity` on the `StockLog` table. All the data in the column will be lost.
  - Added the required column `stock` to the `StockLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InventoryStock" DROP CONSTRAINT "InventoryStock_pkey",
DROP COLUMN "quantity",
ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "skuId" SET DATA TYPE TEXT,
ADD CONSTRAINT "InventoryStock_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "InventoryStock_id_seq";

-- AlterTable
ALTER TABLE "StockLog" DROP CONSTRAINT "StockLog_pkey",
DROP COLUMN "quantity",
ADD COLUMN     "stock" INTEGER NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "skuId" SET DATA TYPE TEXT,
ADD CONSTRAINT "StockLog_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "StockLog_id_seq";

-- CreateEnum
CREATE TYPE "StockLogType" AS ENUM ('import', 'export', 'adjustment', 'rollback', 'order', 'flash_sale');

-- CreateTable
CREATE TABLE "InventoryStock" (
    "id" BIGSERIAL NOT NULL,
    "skuId" BIGINT NOT NULL,
    "skuCode" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockLog" (
    "id" BIGSERIAL NOT NULL,
    "skuId" BIGINT NOT NULL,
    "skuCode" TEXT NOT NULL,
    "type" "StockLogType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "beforeQuantity" INTEGER NOT NULL,
    "afterQuantity" INTEGER NOT NULL,
    "referenceId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryStock_skuCode_key" ON "InventoryStock"("skuCode");

-- CreateIndex
CREATE INDEX "StockLog_skuCode_idx" ON "StockLog"("skuCode");

-- CreateIndex
CREATE INDEX "StockLog_type_idx" ON "StockLog"("type");

-- AddForeignKey
ALTER TABLE "StockLog" ADD CONSTRAINT "StockLog_skuCode_fkey" FOREIGN KEY ("skuCode") REFERENCES "InventoryStock"("skuCode") ON DELETE CASCADE ON UPDATE CASCADE;

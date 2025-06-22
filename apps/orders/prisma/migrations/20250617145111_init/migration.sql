-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'processing', 'shipping', 'completed', 'cancelled', 'failed');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cod', 'momo', 'vnpay', 'paypal');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('unpaid', 'paid', 'failed', 'refunded');

-- CreateTable
CREATE TABLE "Order" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL,
    "shippingFee" DECIMAL(15,2) NOT NULL,
    "discount" DECIMAL(15,2),
    "note" TEXT,
    "receiverName" TEXT NOT NULL,
    "receiverPhone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "ward" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderDetail" (
    "id" BIGSERIAL NOT NULL,
    "orderId" BIGINT NOT NULL,
    "productId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "skuCode" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productImage" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(15,2) NOT NULL,
    "totalPrice" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "OrderDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_code_key" ON "Order"("code");

-- AddForeignKey
ALTER TABLE "OrderDetail" ADD CONSTRAINT "OrderDetail_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

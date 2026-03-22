/*
  Warnings:

  - A unique constraint covering the columns `[txnHash]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "txnHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_txnHash_key" ON "Transaction"("txnHash");

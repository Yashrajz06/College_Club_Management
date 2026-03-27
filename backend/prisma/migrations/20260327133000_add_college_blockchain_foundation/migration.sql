-- CreateEnum
CREATE TYPE "AlgorandNetwork" AS ENUM ('TESTNET', 'LOCALNET');

-- CreateEnum
CREATE TYPE "CollegeContractType" AS ENUM ('TREASURY', 'ENTRY_TOKEN', 'SOULBOUND');

-- CreateEnum
CREATE TYPE "BlockchainActionType" AS ENUM ('DEPLOY', 'TREASURY_LOG', 'MINT', 'VOTE', 'RELEASE');

-- CreateEnum
CREATE TYPE "BlockchainSyncStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

-- AlterTable
ALTER TABLE "CollegeConfig"
ADD COLUMN     "treasuryAppId" TEXT,
ADD COLUMN     "treasuryAddress" TEXT,
ADD COLUMN     "entryTokenAssetId" TEXT,
ADD COLUMN     "soulboundAssetId" TEXT,
ADD COLUMN     "algorandNetwork" "AlgorandNetwork" NOT NULL DEFAULT 'TESTNET',
ADD COLUMN     "algodUrl" TEXT,
ADD COLUMN     "indexerUrl" TEXT;

-- AlterTable
ALTER TABLE "Transaction"
ADD COLUMN     "walletAddress" TEXT,
ADD COLUMN     "blockchainActivityId" TEXT;

-- CreateTable
CREATE TABLE "CollegeContract" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "type" "CollegeContractType" NOT NULL,
    "network" "AlgorandNetwork" NOT NULL,
    "appId" TEXT,
    "assetId" TEXT,
    "address" TEXT,
    "deployedTxId" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollegeContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockchainActivity" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "contractId" TEXT,
    "action" "BlockchainActionType" NOT NULL,
    "txId" TEXT NOT NULL,
    "walletAddress" TEXT,
    "note" TEXT,
    "status" "BlockchainSyncStatus" NOT NULL DEFAULT 'CONFIRMED',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockchainActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_blockchainActivityId_key" ON "Transaction"("blockchainActivityId");

-- CreateIndex
CREATE UNIQUE INDEX "CollegeContract_collegeId_type_network_key" ON "CollegeContract"("collegeId", "type", "network");

-- CreateIndex
CREATE INDEX "CollegeContract_collegeId_idx" ON "CollegeContract"("collegeId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockchainActivity_txId_key" ON "BlockchainActivity"("txId");

-- CreateIndex
CREATE INDEX "BlockchainActivity_collegeId_idx" ON "BlockchainActivity"("collegeId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_blockchainActivityId_fkey" FOREIGN KEY ("blockchainActivityId") REFERENCES "BlockchainActivity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeContract" ADD CONSTRAINT "CollegeContract_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockchainActivity" ADD CONSTRAINT "BlockchainActivity_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockchainActivity" ADD CONSTRAINT "BlockchainActivity_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "CollegeContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

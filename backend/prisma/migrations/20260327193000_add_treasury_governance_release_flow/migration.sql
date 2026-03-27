-- CreateEnum
CREATE TYPE "TreasurySpendRequestStatus" AS ENUM (
  'PENDING_VOTE',
  'APPROVED',
  'REJECTED',
  'READY_FOR_RELEASE',
  'RELEASED',
  'CANCELLED'
);

-- AlterTable
ALTER TABLE "Transaction"
ADD COLUMN "treasurySpendRequestId" TEXT;

-- CreateTable
CREATE TABLE "TreasurySpendRequest" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "status" "TreasurySpendRequestStatus" NOT NULL DEFAULT 'PENDING_VOTE',
  "beneficiaryName" TEXT,
  "beneficiaryWalletAddress" TEXT,
  "timelockUntil" TIMESTAMP(3) NOT NULL,
  "requestTxId" TEXT,
  "releaseTxId" TEXT,
  "receiptUrl" TEXT,
  "receiptHash" TEXT,
  "receiptFileName" TEXT,
  "receiptMimeType" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "collegeId" TEXT NOT NULL,
  "clubId" TEXT NOT NULL,
  "eventId" TEXT,
  "requesterId" TEXT NOT NULL,
  "proposalId" TEXT NOT NULL,
  CONSTRAINT "TreasurySpendRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_treasurySpendRequestId_key" ON "Transaction"("treasurySpendRequestId");
CREATE UNIQUE INDEX "TreasurySpendRequest_proposalId_key" ON "TreasurySpendRequest"("proposalId");
CREATE INDEX "TreasurySpendRequest_collegeId_idx" ON "TreasurySpendRequest"("collegeId");
CREATE INDEX "TreasurySpendRequest_clubId_idx" ON "TreasurySpendRequest"("clubId");
CREATE INDEX "TreasurySpendRequest_eventId_idx" ON "TreasurySpendRequest"("eventId");
CREATE INDEX "TreasurySpendRequest_status_idx" ON "TreasurySpendRequest"("status");

-- AddForeignKey
ALTER TABLE "Transaction"
ADD CONSTRAINT "Transaction_treasurySpendRequestId_fkey"
FOREIGN KEY ("treasurySpendRequestId") REFERENCES "TreasurySpendRequest"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TreasurySpendRequest"
ADD CONSTRAINT "TreasurySpendRequest_collegeId_fkey"
FOREIGN KEY ("collegeId") REFERENCES "College"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TreasurySpendRequest"
ADD CONSTRAINT "TreasurySpendRequest_clubId_fkey"
FOREIGN KEY ("clubId") REFERENCES "Club"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TreasurySpendRequest"
ADD CONSTRAINT "TreasurySpendRequest_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TreasurySpendRequest"
ADD CONSTRAINT "TreasurySpendRequest_requesterId_fkey"
FOREIGN KEY ("requesterId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TreasurySpendRequest"
ADD CONSTRAINT "TreasurySpendRequest_proposalId_fkey"
FOREIGN KEY ("proposalId") REFERENCES "GovernanceProposal"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

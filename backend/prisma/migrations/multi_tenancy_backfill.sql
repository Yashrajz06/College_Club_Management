-- Migration: Add collegeId to existing tables and backfill with a default college
-- Run this against your Supabase PostgreSQL directly before running `prisma db push`

-- Step 1: Create the College and CollegeConfig tables (if they don't exist)
CREATE TABLE IF NOT EXISTS "College" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "College_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "College_name_key" ON "College"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "College_domain_key" ON "College"("domain");

-- Step 2: Insert a default college for existing data
INSERT INTO "College" ("id", "name", "domain", "updatedAt")
VALUES ('default-college-001', 'Default College', 'default.edu', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Step 3: Add walletAddress column to User (if not exists)
DO $$ BEGIN
  ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "walletAddress" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Step 4: Add collegeId to all tables that need it and backfill
DO $$ BEGIN
  ALTER TABLE "User" ADD COLUMN "collegeId" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
UPDATE "User" SET "collegeId" = 'default-college-001' WHERE "collegeId" IS NULL;
ALTER TABLE "User" ALTER COLUMN "collegeId" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "Club" ADD COLUMN "collegeId" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
UPDATE "Club" SET "collegeId" = 'default-college-001' WHERE "collegeId" IS NULL;
ALTER TABLE "Club" ALTER COLUMN "collegeId" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "Event" ADD COLUMN "collegeId" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
UPDATE "Event" SET "collegeId" = 'default-college-001' WHERE "collegeId" IS NULL;
ALTER TABLE "Event" ALTER COLUMN "collegeId" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "Sponsor" ADD COLUMN "collegeId" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
UPDATE "Sponsor" SET "collegeId" = 'default-college-001' WHERE "collegeId" IS NULL;
ALTER TABLE "Sponsor" ALTER COLUMN "collegeId" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "Transaction" ADD COLUMN "collegeId" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
UPDATE "Transaction" SET "collegeId" = 'default-college-001' WHERE "collegeId" IS NULL;
ALTER TABLE "Transaction" ALTER COLUMN "collegeId" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "Task" ADD COLUMN "collegeId" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
UPDATE "Task" SET "collegeId" = 'default-college-001' WHERE "collegeId" IS NULL;
ALTER TABLE "Task" ALTER COLUMN "collegeId" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "Invitation" ADD COLUMN "collegeId" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
UPDATE "Invitation" SET "collegeId" = 'default-college-001' WHERE "collegeId" IS NULL;
ALTER TABLE "Invitation" ALTER COLUMN "collegeId" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "ClubMember" ADD COLUMN "collegeId" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
UPDATE "ClubMember" SET "collegeId" = 'default-college-001' WHERE "collegeId" IS NULL;
ALTER TABLE "ClubMember" ALTER COLUMN "collegeId" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "Registration" ADD COLUMN "collegeId" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
UPDATE "Registration" SET "collegeId" = 'default-college-001' WHERE "collegeId" IS NULL;
ALTER TABLE "Registration" ALTER COLUMN "collegeId" SET NOT NULL;

-- Step 5: Add foreign key constraints
ALTER TABLE "User" ADD CONSTRAINT "User_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Club" ADD CONSTRAINT "Club_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Sponsor" ADD CONSTRAINT "Sponsor_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubMember" ADD CONSTRAINT "ClubMember_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS "User_collegeId_idx" ON "User"("collegeId");
CREATE INDEX IF NOT EXISTS "Club_collegeId_idx" ON "Club"("collegeId");
CREATE INDEX IF NOT EXISTS "Event_collegeId_idx" ON "Event"("collegeId");
CREATE INDEX IF NOT EXISTS "Sponsor_collegeId_idx" ON "Sponsor"("collegeId");
CREATE INDEX IF NOT EXISTS "Transaction_collegeId_idx" ON "Transaction"("collegeId");
CREATE INDEX IF NOT EXISTS "Task_collegeId_idx" ON "Task"("collegeId");

-- Done! After running this, you can safely run: npx prisma db push

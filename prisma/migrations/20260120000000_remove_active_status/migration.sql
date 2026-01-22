-- First, convert all ACTIVE deals to APPROVED
UPDATE "CommunityDeal" SET status = 'APPROVED' WHERE status = 'ACTIVE';

-- Remove ACTIVE from the enum
-- Note: PostgreSQL doesn't allow direct removal of enum values, so we need to recreate the enum
-- First, create a new enum without ACTIVE
CREATE TYPE "CommunityDealStatus_new" AS ENUM ('EXPIRED', 'REPORTED', 'PENDING', 'APPROVED', 'REJECTED');

-- Update the column to use the new enum
ALTER TABLE "CommunityDeal" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "CommunityDeal" ALTER COLUMN "status" TYPE "CommunityDealStatus_new" USING ("status"::text::"CommunityDealStatus_new");

-- Set default back
ALTER TABLE "CommunityDeal" ALTER COLUMN "status" SET DEFAULT 'APPROVED';

-- Drop the old enum and rename the new one
DROP TYPE "CommunityDealStatus";
ALTER TYPE "CommunityDealStatus_new" RENAME TO "CommunityDealStatus";

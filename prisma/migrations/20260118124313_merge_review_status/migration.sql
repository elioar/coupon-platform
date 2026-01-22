-- Migration: merge_review_status_into_status
-- This migration merges reviewStatus enum into status enum
-- Applied via prisma db push - this file is for migration history tracking

-- The following changes were applied:
-- 1. Added PENDING, APPROVED, REJECTED to CommunityDealStatus enum
-- 2. Migrated reviewStatus values to status field  
-- 3. Dropped reviewStatus, reviewedAt, reviewedByAdminId columns
-- 4. Changed status default to APPROVED
-- 5. Dropped ReviewStatus enum type

-- Note: This migration was applied via `prisma db push` due to PostgreSQL
-- enum transaction limitations. The changes are already in the database.

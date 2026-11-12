-- Add Clerk identity to User and align Comic.metadata with schema.prisma.
--
-- This migration is written by hand because the build's provider-switch script can
-- make the working-tree schema drift from the committed migration history. It is
-- intentionally idempotent so it is safe to apply against databases that were
-- originally created with `prisma db push` (production may already have the column).

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clerkId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_clerkId_key" ON "User"("clerkId");

-- schema.prisma declares Comic.metadata as Json?, while the init migration created
-- it as TEXT. Convert in place only when the column is still TEXT.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'Comic'
      AND column_name = 'metadata'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE "Comic" ALTER COLUMN "metadata" TYPE JSONB USING "metadata"::jsonb;
  END IF;
END $$;

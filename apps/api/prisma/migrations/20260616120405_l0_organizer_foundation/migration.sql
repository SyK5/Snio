-- CreateEnum
CREATE TYPE "snio_organizer_kind" AS ENUM ('SYSTEM', 'CLAN', 'ORGANIZATION');

-- AlterTable
ALTER TABLE "snio_events" ADD COLUMN     "organization_id" TEXT,
ADD COLUMN     "organizer_kind" "snio_organizer_kind" NOT NULL DEFAULT 'CLAN',
ALTER COLUMN "clan_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "snio_organizations" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "snio_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "snio_organizations_slug_key" ON "snio_organizations"("slug");

-- CreateIndex
CREATE INDEX "snio_organizations_owner_id_idx" ON "snio_organizations"("owner_id");

-- CreateIndex
CREATE INDEX "snio_organizations_deleted_at_idx" ON "snio_organizations"("deleted_at");

-- CreateIndex
CREATE INDEX "snio_events_organization_id_idx" ON "snio_events"("organization_id");

-- AddForeignKey
ALTER TABLE "snio_organizations" ADD CONSTRAINT "snio_organizations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "snio_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_events" ADD CONSTRAINT "snio_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "snio_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "snio_events" ADD CONSTRAINT "snio_events_organizer_consistency" CHECK (
  (organizer_kind = 'SYSTEM' AND clan_id IS NULL AND organization_id IS NULL)
    OR (organizer_kind = 'CLAN' AND clan_id IS NOT NULL AND organization_id IS NULL)
    OR (organizer_kind = 'ORGANIZATION' AND organization_id IS NOT NULL AND clan_id IS NULL)
  );

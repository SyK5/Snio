-- CreateEnum
CREATE TYPE "snio_event_visibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "snio_registration_policy" AS ENUM ('OPEN', 'INVITE_ONLY', 'CLOSED');

-- CreateEnum
CREATE TYPE "snio_participant_type" AS ENUM ('SOLO', 'TEAM');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "snio_notification_type" ADD VALUE 'EVENT_JOIN_REQUEST';
ALTER TYPE "snio_notification_type" ADD VALUE 'EVENT_JOIN_ACCEPTED';
ALTER TYPE "snio_notification_type" ADD VALUE 'EVENT_JOIN_DECLINED';

-- AlterTable
ALTER TABLE "snio_events" ADD COLUMN     "participant_type" "snio_participant_type" NOT NULL DEFAULT 'SOLO',
ADD COLUMN     "registration_closes_at" TIMESTAMPTZ(6),
ADD COLUMN     "registration_opens_at" TIMESTAMPTZ(6),
ADD COLUMN     "registration_policy" "snio_registration_policy" NOT NULL DEFAULT 'INVITE_ONLY',
ADD COLUMN     "requires_approval" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "visibility" "snio_event_visibility" NOT NULL DEFAULT 'PRIVATE';

-- CreateTable
CREATE TABLE "snio_event_invites" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "target_user_id" TEXT,
    "max_uses" INTEGER,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snio_event_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "snio_event_invites_code_key" ON "snio_event_invites"("code");

-- CreateIndex
CREATE INDEX "snio_event_invites_event_id_idx" ON "snio_event_invites"("event_id");

-- CreateIndex
CREATE INDEX "snio_event_invites_target_user_id_idx" ON "snio_event_invites"("target_user_id");

-- CreateIndex
CREATE INDEX "snio_event_participations_user_id_idx" ON "snio_event_participations"("user_id");

-- AddForeignKey
ALTER TABLE "snio_event_invites" ADD CONSTRAINT "snio_event_invites_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "snio_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_event_invites" ADD CONSTRAINT "snio_event_invites_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "snio_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_event_invites" ADD CONSTRAINT "snio_event_invites_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "snio_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

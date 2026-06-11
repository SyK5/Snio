-- CreateEnum
CREATE TYPE "snio_join_policy" AS ENUM ('OPEN', 'INVITE_ONLY', 'CLOSED');

-- AlterTable
ALTER TABLE "snio_clans" ADD COLUMN     "join_policy" "snio_join_policy" NOT NULL DEFAULT 'OPEN';

-- CreateTable
CREATE TABLE "snio_clan_invites" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "clan_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "target_user_id" TEXT,
    "max_uses" INTEGER,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snio_clan_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "snio_clan_invites_code_key" ON "snio_clan_invites"("code");

-- CreateIndex
CREATE INDEX "snio_clan_invites_clan_id_idx" ON "snio_clan_invites"("clan_id");

-- CreateIndex
CREATE INDEX "snio_clan_invites_target_user_id_idx" ON "snio_clan_invites"("target_user_id");

-- AddForeignKey
ALTER TABLE "snio_clan_invites" ADD CONSTRAINT "snio_clan_invites_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "snio_clans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_clan_invites" ADD CONSTRAINT "snio_clan_invites_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "snio_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_clan_invites" ADD CONSTRAINT "snio_clan_invites_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "snio_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

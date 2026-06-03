/*
  Warnings:

  - You are about to drop the column `mentioned_role` on the `snio_chat_message_mentions` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `snio_clan_members` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "snio_chat_message_mentions" DROP COLUMN "mentioned_role",
ADD COLUMN     "mentioned_role_id" TEXT;

-- AlterTable
ALTER TABLE "snio_clan_members" DROP COLUMN "role";

-- AlterTable
ALTER TABLE "snio_users" ADD COLUMN     "is_platform_admin" BOOLEAN NOT NULL DEFAULT false;

-- DropEnum
DROP TYPE "snio_clan_role";

-- CreateTable
CREATE TABLE "snio_clan_roles" (
    "id" TEXT NOT NULL,
    "clan_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "snio_clan_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_clan_role_grants" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "grant" TEXT NOT NULL,
    "actions" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "snio_clan_role_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_clan_member_roles" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snio_clan_member_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "snio_clan_roles_clan_id_idx" ON "snio_clan_roles"("clan_id");

-- CreateIndex
CREATE UNIQUE INDEX "snio_clan_roles_clan_id_key_key" ON "snio_clan_roles"("clan_id", "key");

-- CreateIndex
CREATE INDEX "snio_clan_role_grants_role_id_idx" ON "snio_clan_role_grants"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "snio_clan_role_grants_role_id_grant_key" ON "snio_clan_role_grants"("role_id", "grant");

-- CreateIndex
CREATE INDEX "snio_clan_member_roles_role_id_idx" ON "snio_clan_member_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "snio_clan_member_roles_member_id_role_id_key" ON "snio_clan_member_roles"("member_id", "role_id");

-- CreateIndex
CREATE INDEX "snio_chat_message_mentions_mentioned_role_id_idx" ON "snio_chat_message_mentions"("mentioned_role_id");

-- AddForeignKey
ALTER TABLE "snio_clan_roles" ADD CONSTRAINT "snio_clan_roles_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "snio_clans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_clan_role_grants" ADD CONSTRAINT "snio_clan_role_grants_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "snio_clan_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_clan_member_roles" ADD CONSTRAINT "snio_clan_member_roles_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "snio_clan_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_clan_member_roles" ADD CONSTRAINT "snio_clan_member_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "snio_clan_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_chat_message_mentions" ADD CONSTRAINT "snio_chat_message_mentions_mentioned_role_id_fkey" FOREIGN KEY ("mentioned_role_id") REFERENCES "snio_clan_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

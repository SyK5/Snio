/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `snio_users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[display_name,discriminator]` on the table `snio_users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `discriminator` to the `snio_users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `snio_users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "snio_users" ADD COLUMN "username" TEXT;
ALTER TABLE "snio_users" ADD COLUMN "discriminator" CHAR(4);
ALTER TABLE "snio_users" ADD COLUMN "pending_fields" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "snio_users"
SET "username" = 'user' || substr(md5("id" || random()::text), 1, 12),
    "pending_fields" = ARRAY['username']
WHERE "username" IS NULL;

WITH numbered AS (
  SELECT "id", lpad(row_number() OVER (PARTITION BY "display_name" ORDER BY "created_at")::text, 4, '0') AS tag
  FROM "snio_users"
)
UPDATE "snio_users" u
SET "discriminator" = numbered.tag
  FROM numbered
WHERE numbered."id" = u."id" AND u."discriminator" IS NULL;

ALTER TABLE "snio_users" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE "snio_users" ALTER COLUMN "discriminator" SET NOT NULL;

CREATE UNIQUE INDEX "snio_users_username_key" ON "snio_users"("username");
CREATE UNIQUE INDEX "snio_users_display_name_discriminator_key" ON "snio_users"("display_name", "discriminator");

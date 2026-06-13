-- CreateTable
CREATE TABLE "snio_notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "snio_notification_type" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "snio_notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "snio_notification_preferences_user_id_idx" ON "snio_notification_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "snio_notification_preferences_user_id_type_key" ON "snio_notification_preferences"("user_id", "type");

-- AddForeignKey
ALTER TABLE "snio_notification_preferences" ADD CONSTRAINT "snio_notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "snio_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

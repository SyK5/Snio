-- AlterTable
ALTER TABLE "snio_audit_logs" ADD COLUMN     "clan_id" TEXT;

-- CreateIndex
CREATE INDEX "snio_audit_logs_clan_id_created_at_idx" ON "snio_audit_logs"("clan_id", "created_at");

-- CreateEnum
CREATE TYPE "snio_clan_role" AS ENUM ('OWNER', 'LEADER', 'TRAINER', 'MEMBER');

-- CreateEnum
CREATE TYPE "snio_participation_status" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED');

-- CreateEnum
CREATE TYPE "snio_chat_channel_type" AS ENUM ('CLAN', 'DIRECT', 'GROUP', 'THREAD');

-- CreateEnum
CREATE TYPE "snio_notification_level" AS ENUM ('ALL', 'MENTIONS_ONLY', 'NONE');

-- CreateEnum
CREATE TYPE "snio_mute_state" AS ENUM ('ACTIVE', 'MUTED_TEMP', 'MUTED_FOREVER');

-- CreateEnum
CREATE TYPE "snio_message_type" AS ENUM ('TEXT', 'SYSTEM', 'IMAGE', 'VIDEO', 'AUDIO', 'VOICE_MESSAGE', 'FILE', 'STICKER', 'GIF', 'EMOJI', 'REPLY', 'THREAD_START', 'CALL', 'CALL_MISSED', 'USER_JOIN', 'USER_LEAVE', 'USER_KICK', 'USER_BAN', 'CHANNEL_RENAME', 'CHANNEL_ICON_CHANGE', 'PIN', 'UNPIN', 'POLL', 'LOCATION', 'STREAM', 'SCREENSHARE', 'COMMAND', 'EPHEMERAL');

-- CreateEnum
CREATE TYPE "snio_device_type" AS ENUM ('WEB', 'MOBILE_IOS', 'MOBILE_ANDROID', 'DESKTOP', 'API');

-- CreateEnum
CREATE TYPE "snio_attachment_type" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'VOICE', 'PDF', 'ARCHIVE', 'DOCUMENT', 'CODE', 'SPREADSHEET', 'MODEL_3D', 'OTHER');

-- CreateEnum
CREATE TYPE "snio_reaction_type" AS ENUM ('EMOJI', 'CUSTOM_EMOJI', 'STICKER');

-- CreateEnum
CREATE TYPE "snio_mention_type" AS ENUM ('USER', 'ROLE', 'EVERYONE', 'HERE');

-- CreateEnum
CREATE TYPE "snio_embed_type" AS ENUM ('LINK', 'GIF', 'IMAGE', 'VIDEO', 'ARTICLE', 'RICH');

-- CreateEnum
CREATE TYPE "snio_call_type" AS ENUM ('VOICE', 'VIDEO');

-- CreateEnum
CREATE TYPE "snio_call_status" AS ENUM ('RINGING', 'ONGOING', 'ENDED', 'MISSED');

-- CreateEnum
CREATE TYPE "snio_notification_type" AS ENUM ('MESSAGE_NEW', 'MESSAGE_MENTION', 'MESSAGE_REPLY', 'MESSAGE_REACTION', 'THREAD_REPLY', 'CHANNEL_INVITE', 'CLAN_INVITE', 'CLAN_ROLE_CHANGED', 'CLAN_KICKED', 'CLAN_MEMBER_JOINED', 'EVENT_INVITE', 'EVENT_REMINDER', 'EVENT_UPDATED', 'EVENT_CANCELLED', 'TRAINING_INVITE', 'TRAINING_REMINDER', 'TRAINING_CANCELLED', 'LEAGUE_ROSTER_ADDED', 'LEAGUE_ROSTER_REMOVED', 'LEAGUE_MATCH_SCHEDULED', 'DOCUMENT_ISSUED', 'SYSTEM_ANNOUNCEMENT', 'ACCOUNT_SECURITY', 'GAME_VOTE_STARTED', 'GAME_VOTE_RESULT');

-- CreateEnum
CREATE TYPE "snio_document_type" AS ENUM ('PARTICIPATION_CERTIFICATE', 'ACHIEVEMENT_CERTIFICATE', 'RANKING_CERTIFICATE', 'EVENT_SUMMARY', 'LEAGUE_REPORT', 'INVOICE', 'OTHER');

-- CreateTable
CREATE TABLE "snio_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "snio_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "snio_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_refresh_tokens" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "replaced_by_id" TEXT,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "snio_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_email_verification_tokens" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "snio_email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_password_reset_tokens" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),

    CONSTRAINT "snio_password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_games" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "snio_games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_clans" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "snio_clans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_clan_members" (
    "id" TEXT NOT NULL,
    "clan_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "snio_clan_role" NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMPTZ(6),

    CONSTRAINT "snio_clan_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_clan_games" (
    "id" TEXT NOT NULL,
    "clan_id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snio_clan_games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_events" (
    "id" TEXT NOT NULL,
    "clan_id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6),
    "location" TEXT,
    "ruleset" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "snio_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_event_participations" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "snio_participation_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snio_event_participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_trainings" (
    "id" TEXT NOT NULL,
    "clan_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6),
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "snio_trainings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_training_participations" (
    "id" TEXT NOT NULL,
    "training_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "snio_participation_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snio_training_participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_leagues" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "game_id" TEXT NOT NULL,
    "starts_at" TIMESTAMPTZ(6),
    "ends_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "snio_leagues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_league_participants" (
    "id" TEXT NOT NULL,
    "league_id" TEXT NOT NULL,
    "clan_id" TEXT NOT NULL,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snio_league_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_league_rosters" (
    "id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "league_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "added_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snio_league_rosters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_chat_channels" (
    "id" TEXT NOT NULL,
    "type" "snio_chat_channel_type" NOT NULL,
    "clan_id" TEXT,
    "parent_id" TEXT,
    "name" TEXT,
    "topic" TEXT,
    "icon_url" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "last_message_at" TIMESTAMPTZ(6),
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "snio_chat_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_chat_channel_members" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "notification_level" "snio_notification_level" NOT NULL DEFAULT 'ALL',
    "mute_state" "snio_mute_state" NOT NULL DEFAULT 'ACTIVE',
    "muted_until" TIMESTAMPTZ(6),
    "last_read_at" TIMESTAMPTZ(6),
    "last_read_message_id" TEXT,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snio_chat_channel_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_chat_messages" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "snio_message_type" NOT NULL DEFAULT 'TEXT',
    "content" TEXT,
    "reply_to_id" TEXT,
    "thread_root_id" TEXT,
    "device_type" "snio_device_type" NOT NULL DEFAULT 'WEB',
    "pinned_at" TIMESTAMPTZ(6),
    "edited_at" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "snio_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_chat_message_attachments" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "type" "snio_attachment_type" NOT NULL,
    "file_name_on_disk" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "s3_bucket" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "checksum" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "duration_seconds" INTEGER,
    "thumbnail_s3_key" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "snio_chat_message_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_chat_message_reactions" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "snio_reaction_type" NOT NULL DEFAULT 'EMOJI',
    "reaction_key" TEXT NOT NULL,
    "custom_emoji_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snio_chat_message_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_chat_message_mentions" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "type" "snio_mention_type" NOT NULL,
    "mentioned_user_id" TEXT,
    "mentioned_role" "snio_clan_role",
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snio_chat_message_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_chat_message_embeds" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "type" "snio_embed_type" NOT NULL DEFAULT 'LINK',
    "url" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "image_url" TEXT,
    "thumbnail_url" TEXT,
    "provider" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snio_chat_message_embeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_chat_message_edits" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "previous_content" TEXT,
    "new_content" TEXT,
    "content_hash" TEXT NOT NULL,
    "previous_hash" TEXT,
    "edited_by_id" TEXT NOT NULL,
    "device_type" "snio_device_type" NOT NULL DEFAULT 'WEB',
    "ip_address" TEXT,
    "edited_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snio_chat_message_edits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_custom_emojis" (
    "id" TEXT NOT NULL,
    "clan_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "cdn_url" TEXT NOT NULL,
    "animated" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "snio_custom_emojis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_stickers" (
    "id" TEXT NOT NULL,
    "clan_id" TEXT,
    "name" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "cdn_url" TEXT NOT NULL,
    "animated" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "snio_stickers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_call_sessions" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "type" "snio_call_type" NOT NULL DEFAULT 'VOICE',
    "status" "snio_call_status" NOT NULL DEFAULT 'RINGING',
    "started_by_id" TEXT NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),

    CONSTRAINT "snio_call_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_call_participants" (
    "id" TEXT NOT NULL,
    "call_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_type" "snio_device_type" NOT NULL DEFAULT 'WEB',
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMPTZ(6),

    CONSTRAINT "snio_call_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_user_devices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "snio_device_type" NOT NULL,
    "name" TEXT,
    "push_token" TEXT,
    "user_agent" TEXT,
    "last_seen_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "snio_user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "snio_notification_type" NOT NULL,
    "payload" JSONB NOT NULL,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snio_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "device_type" "snio_device_type",
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snio_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snio_documents" (
    "id" TEXT NOT NULL,
    "type" "snio_document_type" NOT NULL,
    "title" TEXT NOT NULL,
    "recipient_id" TEXT,
    "clan_id" TEXT,
    "event_id" TEXT,
    "training_id" TEXT,
    "league_id" TEXT,
    "generated_by_id" TEXT,
    "file_name_on_disk" TEXT NOT NULL,
    "s3_bucket" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL DEFAULT 'application/pdf',
    "size_bytes" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "verification_code" TEXT NOT NULL,
    "template_version" TEXT,
    "metadata" JSONB,
    "issued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "snio_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "snio_users_email_key" ON "snio_users"("email");

-- CreateIndex
CREATE INDEX "snio_users_deleted_at_idx" ON "snio_users"("deleted_at");

-- CreateIndex
CREATE INDEX "snio_sessions_user_id_idx" ON "snio_sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "snio_refresh_tokens_token_hash_key" ON "snio_refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "snio_refresh_tokens_user_id_idx" ON "snio_refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "snio_email_verification_tokens_token_hash_key" ON "snio_email_verification_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "snio_email_verification_tokens_email_idx" ON "snio_email_verification_tokens"("email");

-- CreateIndex
CREATE UNIQUE INDEX "snio_password_reset_tokens_token_hash_key" ON "snio_password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "snio_password_reset_tokens_user_id_idx" ON "snio_password_reset_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "snio_games_slug_key" ON "snio_games"("slug");

-- CreateIndex
CREATE INDEX "snio_games_deleted_at_idx" ON "snio_games"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "snio_clans_slug_key" ON "snio_clans"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "snio_clans_tag_key" ON "snio_clans"("tag");

-- CreateIndex
CREATE INDEX "snio_clans_owner_id_idx" ON "snio_clans"("owner_id");

-- CreateIndex
CREATE INDEX "snio_clans_deleted_at_idx" ON "snio_clans"("deleted_at");

-- CreateIndex
CREATE INDEX "snio_clan_members_user_id_idx" ON "snio_clan_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "snio_clan_members_clan_id_user_id_key" ON "snio_clan_members"("clan_id", "user_id");

-- CreateIndex
CREATE INDEX "snio_clan_games_game_id_idx" ON "snio_clan_games"("game_id");

-- CreateIndex
CREATE UNIQUE INDEX "snio_clan_games_clan_id_game_id_key" ON "snio_clan_games"("clan_id", "game_id");

-- CreateIndex
CREATE UNIQUE INDEX "snio_clan_games_owner_id_game_id_key" ON "snio_clan_games"("owner_id", "game_id");

-- CreateIndex
CREATE INDEX "snio_events_clan_id_idx" ON "snio_events"("clan_id");

-- CreateIndex
CREATE INDEX "snio_events_starts_at_idx" ON "snio_events"("starts_at");

-- CreateIndex
CREATE INDEX "snio_events_deleted_at_idx" ON "snio_events"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "snio_event_participations_event_id_user_id_key" ON "snio_event_participations"("event_id", "user_id");

-- CreateIndex
CREATE INDEX "snio_trainings_clan_id_idx" ON "snio_trainings"("clan_id");

-- CreateIndex
CREATE INDEX "snio_trainings_starts_at_idx" ON "snio_trainings"("starts_at");

-- CreateIndex
CREATE INDEX "snio_trainings_deleted_at_idx" ON "snio_trainings"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "snio_training_participations_training_id_user_id_key" ON "snio_training_participations"("training_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "snio_leagues_slug_key" ON "snio_leagues"("slug");

-- CreateIndex
CREATE INDEX "snio_leagues_game_id_idx" ON "snio_leagues"("game_id");

-- CreateIndex
CREATE INDEX "snio_leagues_deleted_at_idx" ON "snio_leagues"("deleted_at");

-- CreateIndex
CREATE INDEX "snio_league_participants_clan_id_idx" ON "snio_league_participants"("clan_id");

-- CreateIndex
CREATE UNIQUE INDEX "snio_league_participants_league_id_clan_id_key" ON "snio_league_participants"("league_id", "clan_id");

-- CreateIndex
CREATE INDEX "snio_league_rosters_participant_id_idx" ON "snio_league_rosters"("participant_id");

-- CreateIndex
CREATE INDEX "snio_league_rosters_user_id_idx" ON "snio_league_rosters"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "snio_league_rosters_league_id_user_id_key" ON "snio_league_rosters"("league_id", "user_id");

-- CreateIndex
CREATE INDEX "snio_chat_channels_clan_id_idx" ON "snio_chat_channels"("clan_id");

-- CreateIndex
CREATE INDEX "snio_chat_channels_parent_id_idx" ON "snio_chat_channels"("parent_id");

-- CreateIndex
CREATE INDEX "snio_chat_channels_last_message_at_idx" ON "snio_chat_channels"("last_message_at");

-- CreateIndex
CREATE INDEX "snio_chat_channels_deleted_at_idx" ON "snio_chat_channels"("deleted_at");

-- CreateIndex
CREATE INDEX "snio_chat_channel_members_user_id_idx" ON "snio_chat_channel_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "snio_chat_channel_members_channel_id_user_id_key" ON "snio_chat_channel_members"("channel_id", "user_id");

-- CreateIndex
CREATE INDEX "snio_chat_messages_channel_id_created_at_idx" ON "snio_chat_messages"("channel_id", "created_at");

-- CreateIndex
CREATE INDEX "snio_chat_messages_user_id_idx" ON "snio_chat_messages"("user_id");

-- CreateIndex
CREATE INDEX "snio_chat_messages_reply_to_id_idx" ON "snio_chat_messages"("reply_to_id");

-- CreateIndex
CREATE INDEX "snio_chat_messages_thread_root_id_idx" ON "snio_chat_messages"("thread_root_id");

-- CreateIndex
CREATE INDEX "snio_chat_messages_deleted_at_idx" ON "snio_chat_messages"("deleted_at");

-- CreateIndex
CREATE INDEX "snio_chat_message_attachments_message_id_idx" ON "snio_chat_message_attachments"("message_id");

-- CreateIndex
CREATE INDEX "snio_chat_message_reactions_message_id_idx" ON "snio_chat_message_reactions"("message_id");

-- CreateIndex
CREATE UNIQUE INDEX "snio_chat_message_reactions_message_id_user_id_reaction_key_key" ON "snio_chat_message_reactions"("message_id", "user_id", "reaction_key");

-- CreateIndex
CREATE INDEX "snio_chat_message_mentions_message_id_idx" ON "snio_chat_message_mentions"("message_id");

-- CreateIndex
CREATE INDEX "snio_chat_message_mentions_mentioned_user_id_idx" ON "snio_chat_message_mentions"("mentioned_user_id");

-- CreateIndex
CREATE INDEX "snio_chat_message_embeds_message_id_idx" ON "snio_chat_message_embeds"("message_id");

-- CreateIndex
CREATE INDEX "snio_chat_message_edits_message_id_edited_at_idx" ON "snio_chat_message_edits"("message_id", "edited_at");

-- CreateIndex
CREATE INDEX "snio_custom_emojis_clan_id_idx" ON "snio_custom_emojis"("clan_id");

-- CreateIndex
CREATE UNIQUE INDEX "snio_custom_emojis_clan_id_name_key" ON "snio_custom_emojis"("clan_id", "name");

-- CreateIndex
CREATE INDEX "snio_stickers_clan_id_idx" ON "snio_stickers"("clan_id");

-- CreateIndex
CREATE INDEX "snio_call_sessions_channel_id_idx" ON "snio_call_sessions"("channel_id");

-- CreateIndex
CREATE INDEX "snio_call_sessions_status_idx" ON "snio_call_sessions"("status");

-- CreateIndex
CREATE INDEX "snio_call_participants_user_id_idx" ON "snio_call_participants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "snio_call_participants_call_id_user_id_key" ON "snio_call_participants"("call_id", "user_id");

-- CreateIndex
CREATE INDEX "snio_user_devices_user_id_idx" ON "snio_user_devices"("user_id");

-- CreateIndex
CREATE INDEX "snio_notifications_user_id_read_at_idx" ON "snio_notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "snio_notifications_user_id_created_at_idx" ON "snio_notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "snio_audit_logs_actor_id_idx" ON "snio_audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "snio_audit_logs_entity_type_entity_id_idx" ON "snio_audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "snio_audit_logs_created_at_idx" ON "snio_audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "snio_documents_verification_code_key" ON "snio_documents"("verification_code");

-- CreateIndex
CREATE INDEX "snio_documents_recipient_id_idx" ON "snio_documents"("recipient_id");

-- CreateIndex
CREATE INDEX "snio_documents_clan_id_idx" ON "snio_documents"("clan_id");

-- CreateIndex
CREATE INDEX "snio_documents_event_id_idx" ON "snio_documents"("event_id");

-- CreateIndex
CREATE INDEX "snio_documents_training_id_idx" ON "snio_documents"("training_id");

-- CreateIndex
CREATE INDEX "snio_documents_league_id_idx" ON "snio_documents"("league_id");

-- CreateIndex
CREATE INDEX "snio_documents_verification_code_idx" ON "snio_documents"("verification_code");

-- CreateIndex
CREATE INDEX "snio_documents_deleted_at_idx" ON "snio_documents"("deleted_at");

-- AddForeignKey
ALTER TABLE "snio_sessions" ADD CONSTRAINT "snio_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "snio_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_refresh_tokens" ADD CONSTRAINT "snio_refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "snio_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_clans" ADD CONSTRAINT "snio_clans_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "snio_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_clan_members" ADD CONSTRAINT "snio_clan_members_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "snio_clans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_clan_members" ADD CONSTRAINT "snio_clan_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "snio_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_clan_games" ADD CONSTRAINT "snio_clan_games_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "snio_clans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_clan_games" ADD CONSTRAINT "snio_clan_games_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "snio_games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_clan_games" ADD CONSTRAINT "snio_clan_games_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "snio_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_events" ADD CONSTRAINT "snio_events_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "snio_clans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_events" ADD CONSTRAINT "snio_events_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "snio_games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_event_participations" ADD CONSTRAINT "snio_event_participations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "snio_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_event_participations" ADD CONSTRAINT "snio_event_participations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "snio_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_trainings" ADD CONSTRAINT "snio_trainings_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "snio_clans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_training_participations" ADD CONSTRAINT "snio_training_participations_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "snio_trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_training_participations" ADD CONSTRAINT "snio_training_participations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "snio_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_leagues" ADD CONSTRAINT "snio_leagues_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "snio_games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_league_participants" ADD CONSTRAINT "snio_league_participants_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "snio_leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_league_participants" ADD CONSTRAINT "snio_league_participants_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "snio_clans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_league_rosters" ADD CONSTRAINT "snio_league_rosters_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "snio_league_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_league_rosters" ADD CONSTRAINT "snio_league_rosters_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "snio_leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_league_rosters" ADD CONSTRAINT "snio_league_rosters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "snio_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_chat_channels" ADD CONSTRAINT "snio_chat_channels_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "snio_clans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_chat_channels" ADD CONSTRAINT "snio_chat_channels_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "snio_chat_channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_chat_channel_members" ADD CONSTRAINT "snio_chat_channel_members_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "snio_chat_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_chat_channel_members" ADD CONSTRAINT "snio_chat_channel_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "snio_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_chat_messages" ADD CONSTRAINT "snio_chat_messages_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "snio_chat_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_chat_messages" ADD CONSTRAINT "snio_chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "snio_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_chat_messages" ADD CONSTRAINT "snio_chat_messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "snio_chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_chat_messages" ADD CONSTRAINT "snio_chat_messages_thread_root_id_fkey" FOREIGN KEY ("thread_root_id") REFERENCES "snio_chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_chat_message_attachments" ADD CONSTRAINT "snio_chat_message_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "snio_chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_chat_message_reactions" ADD CONSTRAINT "snio_chat_message_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "snio_chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_chat_message_reactions" ADD CONSTRAINT "snio_chat_message_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "snio_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_chat_message_reactions" ADD CONSTRAINT "snio_chat_message_reactions_custom_emoji_id_fkey" FOREIGN KEY ("custom_emoji_id") REFERENCES "snio_custom_emojis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_chat_message_mentions" ADD CONSTRAINT "snio_chat_message_mentions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "snio_chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_chat_message_mentions" ADD CONSTRAINT "snio_chat_message_mentions_mentioned_user_id_fkey" FOREIGN KEY ("mentioned_user_id") REFERENCES "snio_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_chat_message_embeds" ADD CONSTRAINT "snio_chat_message_embeds_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "snio_chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_chat_message_edits" ADD CONSTRAINT "snio_chat_message_edits_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "snio_chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_chat_message_edits" ADD CONSTRAINT "snio_chat_message_edits_edited_by_id_fkey" FOREIGN KEY ("edited_by_id") REFERENCES "snio_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_custom_emojis" ADD CONSTRAINT "snio_custom_emojis_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "snio_clans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_custom_emojis" ADD CONSTRAINT "snio_custom_emojis_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "snio_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_stickers" ADD CONSTRAINT "snio_stickers_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "snio_clans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_stickers" ADD CONSTRAINT "snio_stickers_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "snio_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_call_sessions" ADD CONSTRAINT "snio_call_sessions_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "snio_chat_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_call_sessions" ADD CONSTRAINT "snio_call_sessions_started_by_id_fkey" FOREIGN KEY ("started_by_id") REFERENCES "snio_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_call_participants" ADD CONSTRAINT "snio_call_participants_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "snio_call_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_call_participants" ADD CONSTRAINT "snio_call_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "snio_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_user_devices" ADD CONSTRAINT "snio_user_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "snio_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_notifications" ADD CONSTRAINT "snio_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "snio_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_audit_logs" ADD CONSTRAINT "snio_audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "snio_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_documents" ADD CONSTRAINT "snio_documents_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "snio_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_documents" ADD CONSTRAINT "snio_documents_generated_by_id_fkey" FOREIGN KEY ("generated_by_id") REFERENCES "snio_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_documents" ADD CONSTRAINT "snio_documents_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "snio_clans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_documents" ADD CONSTRAINT "snio_documents_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "snio_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_documents" ADD CONSTRAINT "snio_documents_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "snio_trainings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snio_documents" ADD CONSTRAINT "snio_documents_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "snio_leagues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

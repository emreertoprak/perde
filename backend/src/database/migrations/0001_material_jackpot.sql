ALTER TABLE "feature_flags" ALTER COLUMN "enabled" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "feature_flags" ALTER COLUMN "enabled" SET DATA TYPE boolean USING "enabled"::boolean;--> statement-breakpoint
ALTER TABLE "feature_flags" ALTER COLUMN "enabled" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "idempotency_records" ALTER COLUMN "response_status" SET DATA TYPE integer USING "response_status"::integer;--> statement-breakpoint
ALTER TABLE "outbox_events" ALTER COLUMN "attempts" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "outbox_events" ALTER COLUMN "attempts" SET DATA TYPE integer USING "attempts"::integer;--> statement-breakpoint
ALTER TABLE "outbox_events" ALTER COLUMN "attempts" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "webhook_events" ALTER COLUMN "attempts" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "webhook_events" ALTER COLUMN "attempts" SET DATA TYPE integer USING "attempts"::integer;--> statement-breakpoint
ALTER TABLE "webhook_events" ALTER COLUMN "attempts" SET DEFAULT 0;

CREATE TYPE "public"."block_action" AS ENUM('not_found', 'forbidden');--> statement-breakpoint
CREATE TYPE "public"."bot_action" AS ENUM('log_only', 'block', 'challenge');--> statement-breakpoint
CREATE TYPE "public"."campaign_rule_mode" AS ENUM('allow', 'deny');--> statement-breakpoint
CREATE TYPE "public"."campaign_rule_type" AS ENUM('geo', 'ip', 'device', 'browser');--> statement-breakpoint
CREATE TYPE "public"."click_decision" AS ENUM('redirected', 'preview', 'blocked_geo', 'blocked_ip', 'blocked_device', 'blocked_browser', 'bot', 'rate_limited');--> statement-breakpoint
CREATE TYPE "public"."forward_query_mode" AS ENUM('all', 'allowlist', 'none');--> statement-breakpoint
CREATE TYPE "public"."query_conflict" AS ENUM('destination_wins', 'incoming_wins');--> statement-breakpoint
CREATE TYPE "public"."referrer_mode" AS ENUM('passthrough', 'no_referrer');--> statement-breakpoint
CREATE TYPE "public"."tag_provider" AS ENUM('gtag', 'fb_pixel', 'tiktok_pixel', 'histats');--> statement-breakpoint
CREATE TABLE "campaign" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" varchar(64) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"rotation_strategy" "rotation_strategy" DEFAULT 'equal' NOT NULL,
	"delay_ms" integer DEFAULT 0 NOT NULL,
	"forward_query" "forward_query_mode" DEFAULT 'all' NOT NULL,
	"forward_query_keys" text[] DEFAULT '{}' NOT NULL,
	"query_conflict" "query_conflict" DEFAULT 'destination_wins' NOT NULL,
	"referrer_mode" "referrer_mode" DEFAULT 'passthrough' NOT NULL,
	"sticky_visitor" boolean DEFAULT false NOT NULL,
	"sticky_ttl_hours" integer DEFAULT 24 NOT NULL,
	"bot_action" "bot_action" DEFAULT 'log_only' NOT NULL,
	"block_action" "block_action" DEFAULT 'not_found' NOT NULL,
	"og_title" text,
	"og_description" text,
	"og_image" text,
	"expires_at" timestamp,
	"total_clicks" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "campaign_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "campaign_destination" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"url" text NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"weight" integer DEFAULT 100 NOT NULL,
	"priority" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"click_cap" integer,
	"click_count" integer DEFAULT 0 NOT NULL,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"type" "campaign_rule_type" NOT NULL,
	"mode" "campaign_rule_mode" DEFAULT 'deny' NOT NULL,
	"values" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid,
	"provider" "tag_provider" NOT NULL,
	"tag_id" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "click_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"destination_id" uuid,
	"decision" "click_decision" NOT NULL,
	"country" varchar(2),
	"device" text,
	"browser" text,
	"os" text,
	"is_in_app" boolean DEFAULT false NOT NULL,
	"ip_hash" text,
	"referrer_host" text,
	"has_fbclid" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_destination" ADD CONSTRAINT "campaign_destination_campaign_id_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_rule" ADD CONSTRAINT "campaign_rule_campaign_id_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_tag" ADD CONSTRAINT "campaign_tag_campaign_id_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "click_event" ADD CONSTRAINT "click_event_campaign_id_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "click_event" ADD CONSTRAINT "click_event_destination_id_campaign_destination_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."campaign_destination"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campaign_user_id_idx" ON "campaign" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "campaign_status_idx" ON "campaign" USING btree ("status");--> statement-breakpoint
CREATE INDEX "campaign_created_at_idx" ON "campaign" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "campaign_deleted_at_idx" ON "campaign" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "campaign_destination_campaign_id_idx" ON "campaign_destination" USING btree ("campaign_id");--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_rule_campaign_type_uidx" ON "campaign_rule" USING btree ("campaign_id","type");--> statement-breakpoint
CREATE INDEX "campaign_tag_campaign_id_idx" ON "campaign_tag" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "click_event_campaign_created_idx" ON "click_event" USING btree ("campaign_id","created_at");--> statement-breakpoint
CREATE INDEX "click_event_created_at_idx" ON "click_event" USING btree ("created_at");
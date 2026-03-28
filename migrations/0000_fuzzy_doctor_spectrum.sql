CREATE TABLE "accommodations" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_address" text NOT NULL,
	"thumbnail_url" text NOT NULL,
	"nightly_price_from" integer NOT NULL,
	"total_price" integer,
	"currency" text DEFAULT 'GBP',
	"rating" real NOT NULL,
	"review_count" integer NOT NULL,
	"affiliate_url" text NOT NULL,
	"amenities" json DEFAULT '[]'::json,
	"stay_type" text NOT NULL,
	"neighborhood" text NOT NULL,
	"description" text NOT NULL,
	"available" boolean DEFAULT true,
	"booking_com_id" text,
	"latitude" real,
	"longitude" real
);
--> statement-breakpoint
CREATE TABLE "article_likes" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" varchar(36) NOT NULL,
	"user_id" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article_sections" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" varchar(36) NOT NULL,
	"order_index" integer NOT NULL,
	"section_type" text NOT NULL,
	"heading" text,
	"content" text,
	"media_urls" json DEFAULT '[]'::json
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"category" text NOT NULL,
	"excerpt" text NOT NULL,
	"content" text NOT NULL,
	"hero_image_url" text NOT NULL,
	"image_urls" json DEFAULT '[]'::json,
	"published_at" text NOT NULL,
	"author" text NOT NULL,
	"reading_time" integer NOT NULL,
	"boosted_likes" integer DEFAULT 0,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" varchar(36) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"parent_comment_id" varchar(36),
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"edited" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "contact_requests" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"message" text NOT NULL,
	"type" text DEFAULT 'Contact Form' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"is_read" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "event_suggestions" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"name" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text,
	"venue_name" text NOT NULL,
	"address" text NOT NULL,
	"summary" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text,
	"tags" json DEFAULT '[]'::json,
	"ticket_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp,
	"reviewed_by" varchar(255),
	"rejection_reason" text
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text,
	"venue_name" text NOT NULL,
	"address" text NOT NULL,
	"summary" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text NOT NULL,
	"tags" json DEFAULT '[]'::json,
	"ticket_url" text,
	"is_featured" boolean DEFAULT false,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "group_memberships" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" varchar(36) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp DEFAULT now(),
	"approved_at" timestamp,
	"approved_by" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "group_post_comments" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar(36) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"parent_comment_id" varchar(36),
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "group_post_reactions" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar(36) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"reaction_type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_posts" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" varchar(36) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"category" text DEFAULT 'Social' NOT NULL,
	"post_type" text DEFAULT 'post' NOT NULL,
	"image_urls" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"edited" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true,
	CONSTRAINT "groups_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "hero_settings" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"subtitle" text NOT NULL,
	"image_url" text NOT NULL,
	"cta_text" text,
	"cta_link" text
);
--> statement-breakpoint
CREATE TABLE "insider_tips" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"tip" text NOT NULL,
	"author" text NOT NULL,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "member_reviews" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"slug" text NOT NULL,
	"category" text NOT NULL,
	"place_name" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"liked" text NOT NULL,
	"disliked" text NOT NULL,
	"rating" integer NOT NULL,
	"image_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp,
	"reviewed_by" varchar(255),
	CONSTRAINT "member_reviews_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscriptions" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"subscribed_at" text NOT NULL,
	CONSTRAINT "newsletter_subscriptions_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "poll_votes" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" varchar(36) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"option_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "polls" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"poll_type" text DEFAULT 'standard' NOT NULL,
	"image_url" text NOT NULL,
	"options" json NOT NULL,
	"option_images" json DEFAULT '[]'::json,
	"article" text,
	"start_date" timestamp NOT NULL,
	"duration_hours" integer NOT NULL,
	"boosted_votes" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true,
	CONSTRAINT "polls_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ranking_votes" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" varchar(36) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"ranking" json NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"show_stay" boolean DEFAULT true,
	"show_events" boolean DEFAULT true,
	"show_reviews" boolean DEFAULT true,
	"show_community" boolean DEFAULT true,
	"show_ecommerce" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" varchar(255) PRIMARY KEY NOT NULL,
	"mumbles_vibe_name" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vibe_comments" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vibe_id" varchar(36) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"parent_comment_id" varchar(36),
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vibe_reactions" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vibe_id" varchar(36) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"reaction_type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vibes" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"category" text NOT NULL,
	"vibe_type" text DEFAULT 'post' NOT NULL,
	"image_urls" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"edited" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"password_hash" varchar NOT NULL,
	"mumbles_vibe_name" varchar NOT NULL,
	"profile_image_url" varchar,
	"blocked" boolean DEFAULT false,
	"is_admin" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");
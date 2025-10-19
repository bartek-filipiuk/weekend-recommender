CREATE TABLE "search_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"cache_key" varchar(64) NOT NULL,
	"city" varchar(100) NOT NULL,
	"date_range_start" date NOT NULL,
	"date_range_end" date NOT NULL,
	"attendees" text NOT NULL,
	"preferences" text,
	"recommendations" jsonb NOT NULL,
	"agent_metadata" jsonb,
	"expires_at" timestamp NOT NULL,
	"access_count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "search_cache_cache_key_unique" UNIQUE("cache_key")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "search_cache" ADD CONSTRAINT "search_cache_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cache_user_id_idx" ON "search_cache" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cache_key_idx" ON "search_cache" USING btree ("cache_key");--> statement-breakpoint
CREATE INDEX "cache_expires_at_idx" ON "search_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "cache_city_date_idx" ON "search_cache" USING btree ("city","date_range_start");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_token_idx" ON "sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "session_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "username_idx" ON "users" USING btree ("username");
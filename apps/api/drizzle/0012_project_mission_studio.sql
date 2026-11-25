ALTER TABLE "contents" ADD COLUMN IF NOT EXISTS "project_payload" jsonb;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_mission_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"user_id" uuid,
	"session_key" text,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"checked_milestone_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"checked_rubric_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"artifact_url" text,
	"artifact_notes" text,
	"self_reflection" text,
	"ai_critique" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_mission_submissions_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "project_mission_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pms_content_id" ON "project_mission_submissions" USING btree ("content_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pms_user_content" ON "project_mission_submissions" USING btree ("user_id","content_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pms_session_content" ON "project_mission_submissions" USING btree ("session_key","content_id");

ALTER TABLE "project" ADD COLUMN "estimated_total_hours" numeric;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "estimated_total_amount" numeric;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "buffer_ratio" numeric DEFAULT '0.3' NOT NULL;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "start_date" date;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "end_date" date;
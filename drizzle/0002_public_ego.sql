DROP INDEX "uniq_user_auth";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "auth_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "is_active" SET DEFAULT true;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_user_auth" ON "user" USING btree ("auth_id") WHERE "auth_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "setuped_at";--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_auth_id_unique" UNIQUE("auth_id");
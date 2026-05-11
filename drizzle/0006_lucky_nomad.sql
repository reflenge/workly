CREATE TABLE "user_role" (
	"id" smallint PRIMARY KEY NOT NULL,
	"code" varchar(64) NOT NULL,
	"label" varchar(64) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_no" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- user_roleの初期データ。user.role_idの外部キー制約より前に投入する必要があるため、
-- 通常は0007_set.sqlに置くシードを例外的にこの自動生成ファイルに記述している。
INSERT INTO "user_role" (id, code, label, is_active, sort_no)
VALUES
    (1, 'REPRESENTATIVE', '代表', true, 1),
    (2, 'EMPLOYEE', 'その他従業員', true, 2)
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "representative_hourly_rate" numeric;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "employee_hourly_rate" numeric;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role_id" smallint DEFAULT 2 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_user_role_code" ON "user_role" USING btree ("code");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_role_id_user_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."user_role"("id") ON DELETE restrict ON UPDATE cascade;
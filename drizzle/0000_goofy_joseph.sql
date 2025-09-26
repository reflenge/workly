CREATE TABLE "attendance_log_source" (
	"id" smallint PRIMARY KEY NOT NULL,
	"code" varchar(64) NOT NULL,
	"label" varchar(64) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_no" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status_id" smallint NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"started_source" smallint NOT NULL,
	"ended_source" smallint,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_status" (
	"id" smallint PRIMARY KEY NOT NULL,
	"code" varchar(64) NOT NULL,
	"label" varchar(64) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_no" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "card_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"card_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unassigned_at" timestamp with time zone,
	"reason" varchar,
	"assigned_by_user_id" uuid,
	"unassigned_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "card" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"uid" varchar(191) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"inactive_reason" varchar(191),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"base_monthly_salary" numeric,
	"hourly_rate" numeric,
	"worked_minutes" integer DEFAULT 0 NOT NULL,
	"hourly_pay" numeric DEFAULT '0' NOT NULL,
	"total_allowance" numeric DEFAULT '0' NOT NULL,
	"total_deduction" numeric DEFAULT '0' NOT NULL,
	"gross_pay" numeric DEFAULT '0' NOT NULL,
	"net_pay" numeric DEFAULT '0' NOT NULL,
	"currency" varchar(16) DEFAULT 'JPY' NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_period" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL,
	"closed_at" timestamp with time zone,
	"closed_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(191) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"inactive_reason" varchar(191),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_compensation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"is_hourly" boolean DEFAULT true NOT NULL,
	"is_monthly" boolean DEFAULT false NOT NULL,
	"hourly_rate" numeric,
	"monthly_salary" numeric,
	"currency" varchar(16) DEFAULT 'JPY' NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"effective_to" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_id" uuid,
	"is_admin" boolean DEFAULT false NOT NULL,
	"last_name" varchar(191) DEFAULT '' NOT NULL,
	"first_name" varchar(191) DEFAULT '' NOT NULL,
	"last_name_kana" varchar(191),
	"first_name_kana" varchar(191),
	"bio" text,
	"icon_url" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"setuped_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"attendance_log_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendance_log" ADD CONSTRAINT "attendance_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "attendance_log" ADD CONSTRAINT "attendance_log_status_id_attendance_status_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."attendance_status"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "attendance_log" ADD CONSTRAINT "attendance_log_started_source_attendance_log_source_id_fk" FOREIGN KEY ("started_source") REFERENCES "public"."attendance_log_source"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "attendance_log" ADD CONSTRAINT "attendance_log_ended_source_attendance_log_source_id_fk" FOREIGN KEY ("ended_source") REFERENCES "public"."attendance_log_source"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "card_assignment" ADD CONSTRAINT "card_assignment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "card_assignment" ADD CONSTRAINT "card_assignment_card_id_card_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."card"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "payroll_item" ADD CONSTRAINT "payroll_item_period_id_payroll_period_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."payroll_period"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "payroll_item" ADD CONSTRAINT "payroll_item_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_compensation" ADD CONSTRAINT "user_compensation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "work_log" ADD CONSTRAINT "work_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "work_log" ADD CONSTRAINT "work_log_attendance_log_id_attendance_log_id_fk" FOREIGN KEY ("attendance_log_id") REFERENCES "public"."attendance_log"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "work_log" ADD CONSTRAINT "work_log_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_att_source_code" ON "attendance_log_source" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_active_attendance_per_user" ON "attendance_log" USING btree ("user_id") WHERE "ended_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_att_user_started" ON "attendance_log" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_att_status_code" ON "attendance_status" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_active_assignment_per_card" ON "card_assignment" USING btree ("card_id") WHERE "unassigned_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_active_assignment_per_user" ON "card_assignment" USING btree ("user_id") WHERE "unassigned_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_ca_user" ON "card_assignment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_ca_card" ON "card_assignment" USING btree ("card_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_card_uid" ON "card" USING btree ("uid");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_payroll_item_period_user" ON "payroll_item" USING btree ("period_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_payroll_user" ON "payroll_item" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_payroll_period" ON "payroll_period" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_project_active_name" ON "project" USING btree ("is_active","name");--> statement-breakpoint
CREATE INDEX "idx_uc_user_from" ON "user_compensation" USING btree ("user_id","effective_from");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_user_auth" ON "user" USING btree ("auth_id");--> statement-breakpoint
CREATE INDEX "idx_work_user" ON "work_log" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_work_project" ON "work_log" USING btree ("project_id","created_at");
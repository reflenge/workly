/*
スキーマの書き方は以下の通りです。

export const `table name in typescript` = pgTable ( `table name in database`, {
    `column name in typescript` : `database type` ( `db column name` )
})
*/

import {
    pgTable,
    uuid,
    boolean,
    text,
    varchar,
    smallint,
    integer,
    timestamp,
    numeric,
    uniqueIndex,
    index,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";

// ユーザー情報を管理するテーブル。Supabase Authとの紐付けやプロフィール情報を含みます。
export const users = pgTable(
    "user",
    {
        // プログラム内で使うUSER IDはこちら
        id: uuid("id").primaryKey().defaultRandom(),
        // authIdがNULLの場合は未セットアップ。こちらはSupabase Auth ID。
        authId: uuid("auth_id").notNull().unique(),
        isAdmin: boolean("is_admin").notNull().default(false),

        lastName: varchar("last_name", { length: 191 }).notNull().default(""),
        firstName: varchar("first_name", { length: 191 }).notNull().default(""),
        lastNameKana: varchar("last_name_kana", { length: 191 }),
        firstNameKana: varchar("first_name_kana", { length: 191 }),
        bio: text("bio"),
        iconUrl: text("icon_url"),

        isActive: boolean("is_active").notNull().default(true),
        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    // これはusersテーブルのauthId（Supabase Auth ID）に一意制約（unique index）を付与するための定義です。
    // これにより、同じauthIdを持つユーザーが複数登録されることを防ぎます。
    // authIdがnullの場合、unique制約は「null同士は重複とみなさない」ため、複数行でnullが許容されます。
    (t) => ({
        authIdx: uniqueIndex("uniq_user_auth")
            .on(t.authId)
            .where(sql`"auth_id" IS NOT NULL`),
    })
);

// 物理カード（NFC等）の情報を管理するテーブル。
export const cards = pgTable(
    "card",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        uid: varchar("uid", { length: 191 }).notNull(), // 物理UID
        isActive: boolean("is_active").notNull().default(true),
        inactiveReason: varchar("inactive_reason", { length: 191 }),

        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (t) => ({
        uidUnique: uniqueIndex("uniq_card_uid").on(t.uid),
    })
);

// カードの割り当て履歴を管理するテーブル。どのカードが誰にいつ割り当てられたかを記録します。
export const cardAssignments = pgTable(
    "card_assignment",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            // usersテーブルのidを参照する外部キー制約を設定しています。
            // onDelete: "restrict" により、参照先ユーザーが削除される場合は割当履歴も削除できません（参照整合性を保つ）。
            // onUpdate: "cascade" により、ユーザーIDが更新された場合は自動的にこの外部キーも更新されます。
            .references(() => users.id, {
                onDelete: "restrict",
                onUpdate: "cascade",
            }),
        cardId: uuid("card_id")
            .notNull()
            .references(() => cards.id, {
                onDelete: "restrict",
                onUpdate: "cascade",
            }),
        assignedAt: timestamp("assigned_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        unassignedAt: timestamp("unassigned_at", { withTimezone: true }), // NULL=割当中
        // カード割当・解除の理由（例: replace/return/lost等）。任意入力のためNULL可。
        // 最大191文字まで格納可能。
        reason: varchar("reason"),
        // 割当・解除の実施者（任意）
        assignedByUserId: uuid("assigned_by_user_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "restrict",
                onUpdate: "cascade",
            }),
        unassignedByUserId: uuid("unassigned_by_user_id").references(
            () => users.id,
            {
                onDelete: "restrict",
                onUpdate: "cascade",
            }
        ),
        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (t) => ({
        // 部分ユニークは Drizzle の .where(sql``) で作れる（Postgres）
        // カードごとに「現在割当中のレコードが1つしかない」ことを保証する部分ユニーク制約。
        // unassignedAtがNULLの場合のみ有効。
        uniqActivePerCard: uniqueIndex("uniq_active_assignment_per_card")
            .on(t.cardId)
            .where(sql`"unassigned_at" IS NULL`),
        uniqActivePerUser: uniqueIndex("uniq_active_assignment_per_user")
            .on(t.userId)
            .where(sql`"unassigned_at" IS NULL`),
        idxUser: index("idx_ca_user").on(t.userId),
        idxCard: index("idx_ca_card").on(t.cardId),
    })
);

// 勤怠ステータス（勤務中、休憩中、オフなど）のマスターデータを管理するテーブル。
export const attendanceStatus = pgTable(
    "attendance_status",
    {
        id: smallint("id").primaryKey(), // 固定シード
        code: varchar("code", { length: 64 }).notNull(), // 'OFF','WORKING','BREAK'
        label: varchar("label", { length: 64 }).notNull(),
        isActive: boolean("is_active").notNull().default(true),
        sortNo: integer("sort_no").notNull().default(0),
        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (t) => ({
        codeUnique: uniqueIndex("uniq_att_status_code").on(t.code),
    })
);

// 打刻ソース（Web、Discord、NFC、管理画面など）のマスターデータを管理するテーブル。
export const attendanceLogSource = pgTable(
    "attendance_log_source",
    {
        id: smallint("id").primaryKey(), // 固定シード 1.. WEB/DISCORD/NFC/ADMIN
        code: varchar("code", { length: 64 }).notNull(),
        label: varchar("label", { length: 64 }).notNull(),
        isActive: boolean("is_active").notNull().default(true),
        sortNo: integer("sort_no").notNull().default(0),
        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (t) => ({
        codeUnique: uniqueIndex("uniq_att_source_code").on(t.code),
    })
);

// 勤怠ログ（出退勤記録）を管理するテーブル。開始・終了時刻やステータスを記録します。
export const attendanceLogs = pgTable(
    "attendance_log",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "restrict",
                onUpdate: "cascade",
            }),
        statusId: smallint("status_id")
            .notNull()
            .references(() => attendanceStatus.id, {
                onDelete: "restrict",
                onUpdate: "cascade",
            }),
        startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
        endedAt: timestamp("ended_at", { withTimezone: true }), // 未終了=Null
        startedSource: smallint("started_source")
            .notNull()
            .references(() => attendanceLogSource.id, {
                onDelete: "restrict",
                onUpdate: "cascade",
            }),
        endedSource: smallint("ended_source").references(
            () => attendanceLogSource.id,
            { onDelete: "restrict", onUpdate: "cascade" }
        ),
        note: text("note"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (t) => ({
        // “未終了1本”の部分ユニーク
        uniqActiveAttendancePerUser: uniqueIndex(
            "uniq_active_attendance_per_user"
        )
            .on(t.userId)
            .where(sql`"ended_at" IS NULL`),
        // 妥当性チェック（Drizzle: check constraint は raw SQL で追加が無難）
        idxUserStarted: index("idx_att_user_started").on(t.userId, t.startedAt),
    })
);

// プロジェクト情報を管理するテーブル。作業ログの紐付けに使用されます。
export const projects = pgTable(
    "project",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        name: varchar("name", { length: 191 }).notNull(),
        description: text("description"),
        isActive: boolean("is_active").notNull().default(true),
        inactiveReason: varchar("inactive_reason", { length: 191 }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (t) => ({
        idxActiveName: index("idx_project_active_name").on(t.isActive, t.name),
    })
);

// 作業ログを管理するテーブル。勤怠ログやプロジェクトに紐づく具体的な作業内容を記録します。
export const workLogs = pgTable(
    "work_log",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "restrict",
                onUpdate: "cascade",
            }),
        attendanceLogId: uuid("attendance_log_id")
            .notNull()
            .references(() => attendanceLogs.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
        projectId: uuid("project_id")
            .notNull()
            .references(() => projects.id, {
                onDelete: "restrict",
                onUpdate: "cascade",
            }),
        content: text("content").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (t) => ({
        idxWorkUser: index("idx_work_user").on(t.userId, t.createdAt),
        idxWorkProject: index("idx_work_project").on(t.projectId, t.createdAt),
    })
);

// ユーザーの給与・報酬条件（時給、月給など）の履歴を管理するテーブル。
export const userCompensation = pgTable(
    "user_compensation",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "restrict",
                onUpdate: "cascade",
            }),
        isHourly: boolean("is_hourly").notNull().default(true),
        isMonthly: boolean("is_monthly").notNull().default(false),
        hourlyRate: numeric("hourly_rate"), // is_hourly=true のとき使用
        monthlySalary: numeric("monthly_salary"), // is_monthly=true のとき使用
        currency: varchar("currency", { length: 16 }).notNull().default("JPY"),
        effectiveFrom: timestamp("effective_from", {
            withTimezone: true,
        }).notNull(),
        effectiveTo: timestamp("effective_to", { withTimezone: true }),
        isActive: boolean("is_active").notNull().default(true),
        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (t) => ({
        idxCompUserFrom: index("idx_uc_user_from").on(
            t.userId,
            t.effectiveFrom
        ),
        // 期間重複禁止は EXCLUDE で raw SQL（下のマイグレーションで）
    })
);
// 給与計算期間を管理するテーブル。給与計算の対象となる期間（例: 2023年1月1日〜2023年1月31日）を定義します。
export const payrollPeriod = pgTable(
    "payroll_period",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        startDate: timestamp("start_date").notNull(), // date でもOK（ここは好み）
        endDate: timestamp("end_date").notNull(),
        isClosed: boolean("is_closed").notNull().default(false),
        closedAt: timestamp("closed_at", { withTimezone: true }),
        closedByUserId: uuid("closed_by_user_id"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (t) => ({
        idxPeriod: index("idx_payroll_period").on(t.startDate, t.endDate),
    })
);

// 各ユーザーの給与計算明細を管理するテーブル。特定の給与計算期間における個々のユーザーの給与詳細を記録します。
export const payrollItem = pgTable(
    "payroll_item",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        periodId: uuid("period_id")
            .notNull()
            .references(() => payrollPeriod.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "restrict",
                onUpdate: "cascade",
            }),

        baseMonthlySalary: numeric("base_monthly_salary"), // スナップショット
        hourlyRate: numeric("hourly_rate"),
        workedMinutes: integer("worked_minutes").notNull().default(0),
        hourlyPay: numeric("hourly_pay").notNull().default("0"),

        totalAllowance: numeric("total_allowance").notNull().default("0"),
        totalDeduction: numeric("total_deduction").notNull().default("0"),

        grossPay: numeric("gross_pay").notNull().default("0"),
        netPay: numeric("net_pay").notNull().default("0"),
        currency: varchar("currency", { length: 16 }).notNull().default("JPY"),

        isLocked: boolean("is_locked").notNull().default(false),

        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (t) => ({
        uniqPeriodUser: uniqueIndex("uniq_payroll_item_period_user").on(
            t.periodId,
            t.userId
        ),
        idxPayrollUser: index("idx_payroll_user").on(t.userId),
    })
);

export const payrollItemRelations = relations(payrollItem, ({ one }) => ({
    period: one(payrollPeriod, {
        fields: [payrollItem.periodId],
        references: [payrollPeriod.id],
    }),
    user: one(users, {
        fields: [payrollItem.userId],
        references: [users.id],
    }),
}));

export const payrollPeriodRelations = relations(payrollPeriod, ({ many }) => ({
    items: many(payrollItem),
}));

export const usersRelations = relations(users, ({ many }) => ({
    payrollItems: many(payrollItem),
}));

import { db } from "@/db";
import { userCompensation, users } from "@/db/schema";
import { requireUser } from "@/lib/auth/requireUser";
import { redirect } from "next/navigation";
import { PageHeaderMeta } from "@/components/page-header/page-header-meta";
import { and, eq, or, isNull, lte, gte, sql } from "drizzle-orm";
import CompensationList from "./_components/compensation-list";

export default async function CompensationPage() {
    const user = await requireUser();

    // admin 権限のユーザーのみアクセス可能
    if (!user.isAdmin) {
        redirect("/");
    }

    // 現在有効な給与設定を取得
    // isActive=true かつ effectiveFrom <= 現在 AND (effectiveTo IS NULL OR effectiveTo >= 現在)
    const now = new Date();

    const compensationList = await db
        .select({
            id: userCompensation.id,
            userId: userCompensation.userId,
            lastName: users.lastName,
            firstName: users.firstName,
            isHourly: userCompensation.isHourly,
            isMonthly: userCompensation.isMonthly,
            hourlyRate: userCompensation.hourlyRate,
            monthlySalary: userCompensation.monthlySalary,
            currency: userCompensation.currency,
            effectiveFrom: userCompensation.effectiveFrom,
            effectiveTo: userCompensation.effectiveTo,
        })
        .from(userCompensation)
        .innerJoin(users, eq(userCompensation.userId, users.id))
        .where(
            and(
                eq(userCompensation.isActive, true),
                lte(userCompensation.effectiveFrom, now),
                or(
                    isNull(userCompensation.effectiveTo),
                    gte(userCompensation.effectiveTo, now)
                )
            )
        )
        .orderBy(users.lastName, users.firstName);

    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="給与設定"
                description="各アカウントの現在の給与設定を確認し、設定を変更できます。"
            />
            <CompensationList data={compensationList} />
        </div>
    );
}

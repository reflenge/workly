import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import AttendancePunch from "@/components/attendance/attendance-punch";

export default async function TopPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    // ユーザー情報を取得
    const userData = await db
        .select()
        .from(users)
        .where(eq(users.authId, user.id))
        .limit(1);

    if (userData.length === 0) {
        redirect("/auth/login");
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <h1 className="text-4xl font-bold mb-10 text-center">打刻</h1>
            <div className="w-full flex justify-center">
                <AttendancePunch userId={userData[0].id} />
            </div>

            <section className="mt-8 w-full max-w-md mx-auto">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3 shadow-sm">
                    <svg className="w-6 h-6 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2 2" />
                    </svg>
                    <span className="text-blue-900 text-base">
                        休憩から勤務に戻るときも
                        <span className="font-semibold underline decoration-blue-300 decoration-2 underline-offset-2 mx-1">勤務開始</span>
                        ボタンを押してください。
                    </span>
                </div>
            </section>
        </div>
    );
}

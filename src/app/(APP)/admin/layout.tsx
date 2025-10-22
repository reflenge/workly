import { requireUser } from "@/lib/auth/requireUser";

export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await requireUser();
    const isBypassUser = user.id === "bypass-user";

    return (
        <div className="">
            {isBypassUser && (
                <div className="bg-yellow-200 text-red-700 px-4 py-2 text-center font-bold">
                    ※バイパス認証でログイン中です
                </div>
            )}
            {children}
        </div>
    );
}

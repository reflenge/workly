import Link from "next/link";

export default function PrivacyPolicyPage() {
    return (
        <div className="mx-auto w-full max-w-3xl px-6 py-10 space-y-8">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                    プライバシーポリシー
                </h1>
                <p className="text-sm text-muted-foreground">
                    最終更新日: 2026-01-15
                </p>
            </header>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold">1. 収集する情報</h2>
                <p className="text-muted-foreground">
                    本サービスでは、利用登録やサービス提供に必要な範囲で、氏名、メールアドレス、所属情報、
                    勤怠・作業ログなどの情報を取得します。また、アクセスログやCookie等の技術情報を取得する場合があります。
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold">2. 利用目的</h2>
                <p className="text-muted-foreground">
                    取得した情報は、本人確認、勤怠管理、業務ログの記録、通知の送付、セキュリティ確保、
                    サービス改善・分析のために利用します。
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold">3. 第三者提供</h2>
                <p className="text-muted-foreground">
                    法令に基づく場合を除き、本人の同意なく第三者に個人情報を提供しません。
                    ただし、決済・通知・分析などの業務委託先に必要な範囲で共有する場合があります。
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold">4. Cookie等の利用</h2>
                <p className="text-muted-foreground">
                    本サービスは、利便性向上や利用状況の分析のためにCookieや類似技術を利用することがあります。
                    ブラウザ設定により無効化できますが、一部機能が利用できない場合があります。
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold">5. 安全管理措置</h2>
                <p className="text-muted-foreground">
                    個人情報の漏えい、滅失、改ざんを防止するため、合理的な安全管理措置を講じます。
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold">6. 開示・訂正・削除</h2>
                <p className="text-muted-foreground">
                    本人からの開示、訂正、利用停止、削除等の請求があった場合は、法令に従い適切に対応します。
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold">7. お問い合わせ</h2>
                <p className="text-muted-foreground">
                    本ポリシーに関するお問い合わせは、運営までご連絡ください。
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold">8. 改定</h2>
                <p className="text-muted-foreground">
                    本ポリシーは、必要に応じて改定されます。改定後は本ページにて告知します。
                </p>
            </section>
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-sm">
                <Link
                    href="/"
                    className="text-slate-600 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
                >
                    アプリケーションへ戻る
                </Link>
            </div>
        </div>
    );
}

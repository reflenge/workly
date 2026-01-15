import Link from "next/link";

export default function TermsPage() {
    return (
        <div className="mx-auto w-full max-w-3xl px-6 py-10 space-y-8">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">利用規約</h1>
                <p className="text-sm text-muted-foreground">
                    最終更新日: 2026-01-15
                </p>
            </header>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold">1. 適用</h2>
                <p className="text-muted-foreground">
                    本規約は、本サービスの利用に関する条件を定めるものです。利用者は、本規約に同意のうえで本サービスを利用します。
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold">2. 利用登録</h2>
                <p className="text-muted-foreground">
                    利用登録は、当社が定める方法により行うものとします。不正確な情報の提供や不正利用が判明した場合、
                    当社は登録の停止・削除を行うことがあります。
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold">3. 禁止事項</h2>
                <p className="text-muted-foreground">
                    法令違反、公序良俗に反する行為、システムへの不正アクセス、他者の権利侵害、サービス運営の妨害などを禁止します。
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold">4. サービスの提供停止</h2>
                <p className="text-muted-foreground">
                    システム保守や障害対応、その他やむを得ない事由により、事前の通知なく本サービスの提供を停止または中断する場合があります。
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold">5. 免責事項</h2>
                <p className="text-muted-foreground">
                    当社は、本サービスの完全性、正確性、有用性を保証しません。利用者に生じた損害について、
                    当社の故意または重過失による場合を除き責任を負いません。
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold">6. 知的財産権</h2>
                <p className="text-muted-foreground">
                    本サービスに関する著作権、商標権その他の知的財産権は当社または正当な権利者に帰属します。
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold">7. 規約の変更</h2>
                <p className="text-muted-foreground">
                    当社は、必要に応じて本規約を変更することがあります。変更後の規約は本ページにて告知します。
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold">8. 準拠法・裁判管轄</h2>
                <p className="text-muted-foreground">
                    本規約は日本法に準拠し、本サービスに関連して生じる紛争は当社所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。
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

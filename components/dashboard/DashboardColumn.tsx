import type { ReactNode } from "react"

export function DashboardColumn({
    title,
    count,
    icon,
    accent,
    children,
}: {
    title: string
    count: number
    icon: ReactNode
    accent: "green" | "blue"
    children: ReactNode
}) {
    const accentClasses =
        accent === "green"
            ? "bg-[#e5f4ed] text-[#3b8d65]"
            : "bg-[#e7f1f2] text-[#2f6975]"

    return (
        <section className="flex min-h-162.5 flex-col rounded-[2rem] border border-[#d7e1e3] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`flex size-10 items-center justify-center rounded-2xl ${accentClasses}`}>
                        <div className="[&_svg]:size-5">{icon}</div>
                    </div>
                    <h2 className="text-2xl font-bold tracking-[-0.03em] text-[#16262f]">{title}</h2>
                </div>
                <div className="rounded-full bg-[#eef3ee] px-3 py-1 text-lg font-black text-muted-foreground">
                    {count}
                </div>
            </div>

            {children}
        </section>
    )
}

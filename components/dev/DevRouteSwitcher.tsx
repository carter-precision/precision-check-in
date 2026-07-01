"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function DevRouteSwitcher() {
    if (process.env.NODE_ENV !== "development") {
        return null
    }

    const pathname = usePathname()

    const routes = [
        {
            label: "Kiosk",
            href: "/kiosk/layton",
        },
        {
            label: "Dashboard",
            href: "/dashboard/layton",
        },
    ]

    return (
        <div className="fixed left-4 top-4 z-9999 flex overflow-hidden rounded-full border border-slate-300 bg-white shadow-lg">
            {routes.map((route) => {
                const active = pathname === route.href

                return (
                    <Link
                        key={route.href}
                        href={route.href}
                        className={`px-5 py-2 text-sm font-bold transition ${active
                            ? "bg-slate-900 text-white"
                            : "bg-white text-slate-600 hover:bg-slate-100"
                            }`}
                    >
                        {route.label}
                    </Link>
                )
            })}
        </div>
    )
}
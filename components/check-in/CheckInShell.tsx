import { CalendarClock, CircleAlert } from "lucide-react"

export function CheckInShell({ children }: { children: React.ReactNode }) {
    return (
        <main className="flex min-h-screen items-center justify-center px-5 py-10">
            <div className="w-full max-w-lg">
                <section>
                    {children}
                </section>
            </div>
        </main>
    )
}

export function CheckInUnavailable() {
    return (
        <CheckInShell>
            <div className="py-7 text-center">
                <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-[#fff4e5] text-[#a56a13]">
                    <CircleAlert className="size-8" />
                </div>
                <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#16262f]">We couldn&apos;t find your appointment</h1>
                <p className="mx-auto mt-4 max-w-sm text-lg font-medium leading-relaxed text-muted-foreground">
                    Please head inside and check in at the kiosk. Our team will be happy to help you.
                </p>
            </div>
        </CheckInShell>
    )
}

export function CheckInTooEarly() {
    return (
        <CheckInShell>
            <div className="py-7 text-center">
                <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-accent-tint text-accent">
                    <CalendarClock className="size-8" />
                </div>
                <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#16262f]">Check-in isn&apos;t open yet</h1>
                <p className="mx-auto mt-4 max-w-sm text-lg font-medium leading-relaxed text-muted-foreground">
                    Please return closer to your appointment time or check in at the kiosk when you arrive.
                </p>
            </div>
        </CheckInShell>
    )
}

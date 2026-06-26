"use client"

import { useMemo, useState } from "react"
import {
    AlarmClock,
    CalendarCheck,
    CheckCircle2,
    Clock,
    UserRound,
    Wrench,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { PrecisionLogo } from "../ui/logo"

type CheckInType = "appointment" | "walk-in"

type CheckIn = {
    id: string
    type: CheckInType
    customerName: string
    serviceLabel: string
    createdAt: Date
}

const demoCheckIns: CheckIn[] = [
    {
        id: "1",
        type: "appointment",
        customerName: "Maria Alvarez",
        serviceLabel: "Windshield replacement",
        createdAt: new Date(Date.now() - 2 * 60 * 1000),
    },
    {
        id: "2",
        type: "appointment",
        customerName: "Derek Cho",
        serviceLabel: "ADAS calibration",
        createdAt: new Date(Date.now() - 9 * 60 * 1000),
    },
    {
        id: "3",
        type: "walk-in",
        customerName: "Sam Whitfield",
        serviceLabel: "Rock chip repair",
        createdAt: new Date(Date.now() - 6 * 60 * 1000),
    },
]

export function TechDashboard({ location }: { location: string }) {
    const [clock] = useState(() =>
        new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "2-digit",
        }).format(new Date()),
    )

    const [checkIns, setCheckIns] = useState(demoCheckIns)

    const appointments = useMemo(
        () => checkIns.filter((checkIn) => checkIn.type === "appointment"),
        [checkIns],
    )

    const walkIns = useMemo(
        () => checkIns.filter((checkIn) => checkIn.type === "walk-in"),
        [checkIns],
    )

    function acknowledge(id: string) {
        setCheckIns((current) => current.filter((checkIn) => checkIn.id !== id))
    }

    return (
        <main className="min-h-screen bg-[#f7f9f9] text-[#1f2933]">
            <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-5 sm:px-8 md:px-10">
                <DashboardHeader clock={clock} location={location} />

                <div className="grid flex-1 gap-6 py-6 lg:grid-cols-2">
                    <DashboardColumn
                        title="Appointments"
                        count={appointments.length}
                        icon={<CalendarCheck />}
                        accent="green"
                    >
                        {appointments.length > 0 ? (
                            appointments.map((checkIn) => (
                                <CustomerCard
                                    key={checkIn.id}
                                    checkIn={checkIn}
                                    onAcknowledge={() => acknowledge(checkIn.id)}
                                />
                            ))
                        ) : (
                            <EmptyState label="No appointments waiting" />
                        )}
                    </DashboardColumn>

                    <DashboardColumn
                        title="Walk-ins"
                        count={walkIns.length}
                        icon={<UserRound />}
                        accent="blue"
                    >
                        {walkIns.length > 0 ? (
                            walkIns.map((checkIn) => (
                                <CustomerCard
                                    key={checkIn.id}
                                    checkIn={checkIn}
                                    onAcknowledge={() => acknowledge(checkIn.id)}
                                />
                            ))
                        ) : (
                            <EmptyState label="No walk-ins waiting" />
                        )}
                    </DashboardColumn>
                </div>
            </div>
        </main>
    )
}

function DashboardHeader({
    clock,
    location,
}: {
    clock: string
    location: string
}) {
    return (
        <header className="grid grid-cols-3 items-center gap-5">
            <div>
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#16262f]">
                    Front desk
                </h1>
                <p className="text-base font-medium capitalize text-[#6f7f86]">
                    {location.replaceAll("-", " ")} · Live customer activity
                </p>
            </div>

            <div className="flex justify-center">
                <PrecisionLogo />
            </div>

            <div className="flex justify-end">
                <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold tabular-nums text-[#16262f] shadow-sm">
                    <span className="size-2 rounded-full bg-[#9ad18b]" />
                    {clock}
                </div>
            </div>
        </header>
    )
}

function DashboardColumn({
    title,
    count,
    icon,
    accent,
    children,
}: {
    title: string
    count: number
    icon: React.ReactNode
    accent: "green" | "blue"
    children: React.ReactNode
}) {
    const accentClasses =
        accent === "green"
            ? "bg-[#e5f4ed] text-[#3b8d65]"
            : "bg-[#e7f1f2] text-[#2f6975]"

    return (
        <section className="flex min-h-[650px] flex-col rounded-[2rem] border border-[#d7e1e3] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`flex size-10 items-center justify-center rounded-2xl ${accentClasses}`}>
                        <div className="[&_svg]:size-5">{icon}</div>
                    </div>

                    <h2 className="text-2xl font-bold tracking-[-0.03em] text-[#16262f]">
                        {title}
                    </h2>
                </div>

                <div className="rounded-full bg-[#eef3ee] px-3 py-1 text-lg font-black text-[#60727f]">
                    {count}
                </div>
            </div>

            <div className="grid gap-4">{children}</div>
        </section>
    )
}

function CustomerCard({
    checkIn,
    onAcknowledge,
}: {
    checkIn: CheckIn
    onAcknowledge: () => void
}) {
    const waitingMinutes = Math.max(
        0,
        Math.floor((Date.now() - checkIn.createdAt.getTime()) / 60000),
    )

    const needsAttention = waitingMinutes >= 8

    return (
        <article
            className={`rounded-[1.4rem] border p-5 shadow-sm transition ${needsAttention
                ? "border-[#e3b75f] bg-[#fff8e8]"
                : "border-[#d7e1e3] bg-[#f7f9f9]"
                }`}
        >
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <div className="mb-1 flex items-center gap-2">
                        <h3 className="text-2xl font-black tracking-[-0.03em] text-[#16262f]">
                            {checkIn.customerName}
                        </h3>

                        {needsAttention && (
                            <span className="rounded-full bg-[#fff0c2] px-2 py-1 text-xs font-black uppercase tracking-wide text-[#9b6a00]">
                                Needs attention
                            </span>
                        )}
                    </div>

                    <p className="text-lg font-medium text-[#6f7f86]">
                        {checkIn.serviceLabel}
                    </p>
                </div>

                <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-bold text-[#60727f] shadow-sm">
                    <Clock className="size-4" />
                    {waitingMinutes <= 0 ? "just now" : `${waitingMinutes} min`}
                </div>
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.08em] text-[#7c8b91]">
                    <Wrench className="size-4" />
                    Waiting
                </div>

                <Button
                    className="h-12 rounded-2xl bg-[#2f6975] px-6 text-base font-bold shadow-lg shadow-[#2f6975]/20 hover:bg-[#285a64]"
                    onClick={onAcknowledge}
                >
                    <CheckCircle2 className="size-5" />
                    Acknowledge
                </Button>
            </div>
        </article>
    )
}

function EmptyState({ label }: { label: string }) {
    return (
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-[#d7e1e3] bg-[#f7f9f9] text-center">
            <AlarmClock className="mb-4 size-12 text-[#b6c2c6]" />
            <p className="text-xl font-semibold text-[#9aa8ad]">{label}</p>
        </div>
    )
}
"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    AlarmClock,
    BellRing,
    CalendarCheck,
    CheckCircle2,
    Clock,
    UserRound,
    Volume2,
} from "lucide-react"
import { useCheckInChime } from "@/hooks/useCheckInChime"

import { Button } from "@/components/ui/button"

import type { Database } from "@/lib/supabase/types"
import { closeCheckInAction } from "@/app/actions/check-ins"
import { useNow } from "@/hooks/useNow"

type CheckIn = Database["public"]["Tables"]["check_ins"]["Row"]

const ATTENTION_THRESHOLD_SECONDS = 8
const RECENTLY_CLOSED_MS = 30 * 60 * 1000

const CHIME_SOUNDS = [
    { label: "Chime 1", path: "/sound-1.mp3" },
    { label: "Chime 2", path: "/sound-2.mp3" },
    { label: "Chime 3", path: "/sound-3.mp3" },
    { label: "Chime 4", path: "/sound-4.mp3" },
    { label: "Chime 5", path: "/sound-5.mp3" },
]

export function TechDashboard({
    location,
    locationId,
    initialCheckIns,
}: {
    location: string
    locationId: string
    initialCheckIns: CheckIn[]
}) {
    const now = useNow()
    const [checkIns, setCheckIns] = useState(initialCheckIns)
    const [showSoundSettings, setShowSoundSettings] = useState(false)

    useEffect(() => {
        if (!now) return

        setCheckIns((current) =>
            current.filter((checkIn) => {
                if (checkIn.status !== "closed") return true
                if (!checkIn.closed_at) return false

                return now.getTime() - new Date(checkIn.closed_at).getTime() < RECENTLY_CLOSED_MS
            }),
        )
    }, [now])

    const waitingCheckIns = useMemo(
        () => checkIns.filter((checkIn) => checkIn.status === "waiting"),
        [checkIns],
    )

    const {
        // isChimeEnabled,
        isAudioUnlocked,
        soundPath,
        enableChime,
        // disableChime,
        changeSound,
    } = useCheckInChime(waitingCheckIns.length > 0)

    useEffect(() => {
        const supabase = createClient()

        const channel = supabase
            .channel(`check-ins-${location}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "check_ins",
                    filter: `location_id=eq.${locationId}`,
                },
                (payload) => {
                    setCheckIns((current) => {
                        if (payload.eventType === "INSERT") {
                            const newCheckIn = payload.new as CheckIn

                            if (newCheckIn.status !== "waiting") return current
                            if (current.some((checkIn) => checkIn.id === newCheckIn.id)) return current

                            return [...current, newCheckIn].sort((a, b) =>
                                a.created_at.localeCompare(b.created_at),
                            )
                        }

                        if (payload.eventType === "UPDATE") {
                            const updatedCheckIn = payload.new as CheckIn

                            if (updatedCheckIn.status === "closed" && !updatedCheckIn.closed_at) {
                                return current
                            }

                            const exists = current.some((checkIn) => checkIn.id === updatedCheckIn.id)

                            if (!exists && updatedCheckIn.status !== "waiting") return current

                            if (!exists) {
                                return [...current, updatedCheckIn].sort((a, b) =>
                                    a.created_at.localeCompare(b.created_at),
                                )
                            }

                            return current.map((checkIn) =>
                                checkIn.id === updatedCheckIn.id ? updatedCheckIn : checkIn,
                            )
                        }

                        return current
                    })
                },
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [location, locationId])

    const appointmentWaiting = useMemo(
        () =>
            checkIns.filter(
                (checkIn) =>
                    checkIn.visit_type === "appointment" &&
                    checkIn.status === "waiting",
            ),
        [checkIns],
    )

    const appointmentRecent = useMemo(
        () =>
            checkIns.filter(
                (checkIn) =>
                    checkIn.visit_type === "appointment" &&
                    checkIn.status === "closed",
            ),
        [checkIns],
    )

    const walkInWaiting = useMemo(
        () =>
            checkIns.filter(
                (checkIn) =>
                    checkIn.visit_type === "walk_in" &&
                    checkIn.status === "waiting",
            ),
        [checkIns],
    )

    const walkInRecent = useMemo(
        () =>
            checkIns.filter(
                (checkIn) =>
                    checkIn.visit_type === "walk_in" &&
                    checkIn.status === "closed",
            ),
        [checkIns],
    )

    const clock = now
        ? new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "2-digit",
        }).format(now)
        : ""

    async function closeCheckIn(id: string) {
        const previous = checkIns
        const closedAt = new Date().toISOString()

        setCheckIns((current) =>
            current.map((checkIn) =>
                checkIn.id === id
                    ? {
                        ...checkIn,
                        status: "closed",
                        closed_at: closedAt,
                    }
                    : checkIn,
            ),
        )

        try {
            await closeCheckInAction(id)
        } catch (error) {
            console.error("Failed to close check-in:", error)
            setCheckIns(previous)
            alert("Could not acknowledge check-in. Please try again.")
        }
    }

    return (
        <main className="min-h-screen bg-[#f7f9f9] text-[#1f2933]">
            <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-5 sm:px-8 md:px-10">
                <DashboardHeader
                    clock={clock}
                    location={location}
                    // isChimeEnabled={isChimeEnabled}
                    // isAudioUnlocked={isAudioUnlocked}
                    enableChime={enableChime}
                    // disableChime={disableChime}
                    setShowSoundSettings={setShowSoundSettings}
                />

                <div className="grid flex-1 gap-6 py-6 lg:grid-cols-2">
                    <DashboardColumn
                        title="Appointments"
                        count={appointmentWaiting.length}
                        icon={<CalendarCheck />}
                        accent="green"
                    >
                        <CheckInList
                            waiting={appointmentWaiting}
                            recent={appointmentRecent}
                            emptyLabel="No appointments waiting"
                            now={now}
                            onCloseCheckIn={closeCheckIn}
                        />
                    </DashboardColumn>

                    <DashboardColumn
                        title="Walk-ins"
                        count={walkInWaiting.length}
                        icon={<UserRound />}
                        accent="blue"
                    >
                        <CheckInList
                            waiting={walkInWaiting}
                            recent={walkInRecent}
                            emptyLabel="No walk-ins waiting"
                            now={now}
                            onCloseCheckIn={closeCheckIn}
                        />
                    </DashboardColumn>
                </div>
            </div>
            {!isAudioUnlocked && (
                <EnableSoundOverlay onEnableSound={enableChime} />
            )}
            {showSoundSettings && (
                <SoundSettingsDialog
                    selectedSoundPath={soundPath}
                    onSelectSound={changeSound}
                    onClose={() => setShowSoundSettings(false)}
                />
            )}
        </main>
    )
}

function CheckInList({
    waiting,
    recent,
    emptyLabel,
    now,
    onCloseCheckIn,
}: {
    waiting: CheckIn[]
    recent: CheckIn[]
    emptyLabel: string
    now: Date | null
    onCloseCheckIn: (id: string) => void
}) {
    return (
        <div className="grid gap-4">
            {waiting.length > 0 ? (
                waiting.map((checkIn) => (
                    <CustomerCard
                        key={checkIn.id}
                        checkIn={checkIn}
                        now={now}
                        onCloseCheckIn={() => onCloseCheckIn(checkIn.id)}
                    />
                ))
            ) : (
                <EmptyState label={emptyLabel} compact={recent.length > 0} />
            )}

            {recent.length > 0 && (
                <div className="mt-3 border-t border-[#d7e1e3] pt-4">
                    <p className="mb-3 text-sm font-bold uppercase tracking-[0.07em] text-[#9aa8ad]">
                        Recently acknowledged
                    </p>

                    <div className="grid gap-3">
                        {recent.map((checkIn) => (
                            <CustomerCard
                                key={checkIn.id}
                                checkIn={checkIn}
                                now={now}
                                onCloseCheckIn={() => onCloseCheckIn(checkIn.id)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function DashboardHeader({
    clock,
    location,
    // isChimeEnabled,
    // isAudioUnlocked,
    enableChime,
    // disableChime,
    setShowSoundSettings,
}: {
    clock: string
    location: string
    // isChimeEnabled: boolean
    // isAudioUnlocked: boolean
    enableChime: () => void
    // disableChime: () => void
    setShowSoundSettings: (show: boolean) => void
}) {
    return (
        <header className="flex items-center justify-between px-0.5">
            <div>
                <h1 className="text-3xl font-bold capitalize tracking-[-0.04em] text-[#16262f]">
                    {location.replaceAll("-", " ") || "Front desk"}
                </h1>
                <p className="text-base font-medium capitalize text-[#6f7f86]">
                    Live customer activity
                </p>
            </div>

            <div className="flex items-center gap-2">
                {/* <Button
                    variant="ghost"
                    className="text-[#6f7f86] hover:bg-transparent"
                    onClick={isChimeEnabled && isAudioUnlocked ? disableChime : enableChime}
                >
                    {isChimeEnabled && isAudioUnlocked ? (
                        <Volume2 className="size-6 stroke-[2.3]" />
                    ) : (
                        <>
                            <p className="text-lg font-bold text-red-500">MUTED</p>
                            <VolumeX className="size-6 stroke-[2.3] text-red-500" />
                        </>
                    )}
                </Button> */}

                <Button
                    variant="ghost"
                    className="text-[#6f7f86] hover:bg-transparent"
                    onClick={() => setShowSoundSettings(true)}
                >
                    <Volume2 className="size-6 stroke-[2.3]" />
                </Button>

                <div className="text-lg font-semibold tabular-nums text-[#6f7f86]">
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
        <section className="flex min-h-162.5 flex-col rounded-[2rem] border border-[#d7e1e3] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`flex size-10 items-center justify-center rounded-2xl ${accentClasses}`}>
                        <div className="[&_svg]:size-5">{icon}</div>
                    </div>

                    <h2 className="text-2xl font-bold tracking-[-0.03em] text-[#16262f]">
                        {title}
                    </h2>
                </div>

                <div className="rounded-full bg-[#eef3ee] px-3 py-1 text-lg font-black text-muted-foreground">
                    {count}
                </div>
            </div>

            {children}
        </section>
    )
}

function CustomerCard({
    checkIn,
    now,
    onCloseCheckIn,
}: {
    checkIn: CheckIn
    now: Date | null
    onCloseCheckIn: () => void
}) {
    const isClosed = checkIn.status === "closed"
    const createdAt = new Date(checkIn.created_at)

    const elapsedSeconds = now ? Math.max(
        0,
        Math.floor((now.getTime() - createdAt.getTime()) / 1000),
    ) : 0

    const needsAttention = !isClosed && elapsedSeconds >= ATTENTION_THRESHOLD_SECONDS

    return (
        <article
            className={`rounded-[1.4rem] border p-5 shadow-sm transition ${isClosed
                ? "border-[#d7e1e3] bg-[#f7f9f9] opacity-75"
                : needsAttention
                    ? "border-[#e35f5f] bg-[#ffe8e8]"
                    : "border-[#e3b75f] bg-[#fff8e8]"
                }`}
        >
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <div className="mb-1 flex items-center gap-2">
                        <h3 className="text-2xl font-bold tracking-[-0.03em] text-[#16262f]">
                            {checkIn.customer_name}
                        </h3>

                        {needsAttention && (
                            <span className="rounded-full bg-[#ffc2c2] px-2 py-1 text-xs font-black uppercase tracking-wide text-[#9b0000]">
                                Needs attention
                            </span>
                        )}

                        {isClosed && (
                            <span className="rounded-full bg-[#e5f4ed] px-2 py-1 text-xs font-black uppercase tracking-wide text-[#3b8d65]">
                                Acknowledged
                            </span>
                        )}
                    </div>

                    <p className="text-lg font-medium text-[#6f7f86]">
                        {formatServiceLabel(checkIn)}
                    </p>
                </div>

                <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-bold tabular-nums text-muted-foreground shadow-sm">
                    <Clock className="size-4" />
                    {isClosed ? formatClosedLabel(checkIn, now) : formatWaitingLabel(elapsedSeconds)}
                </div>
            </div>

            <div className="flex items-center justify-end gap-4">
                {/* <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.08em] text-[#7c8b91]">
                    <Wrench className="size-4" />
                    {isClosed ? "Acknowledged" : "Waiting"}
                </div> */}

                {!isClosed && (
                    <Button
                        className="h-12 rounded-2xl bg-[#2f6975] px-6 text-base font-bold shadow-lg shadow-[#2f6975]/20 hover:bg-[#285a64]"
                        onClick={onCloseCheckIn}
                    >
                        <CheckCircle2 className="size-5" />
                        Acknowledge
                    </Button>
                )}
            </div>
        </article>
    )
}

function EmptyState({
    label,
    compact = false,
}: {
    label: string
    compact?: boolean
}) {
    return (
        <div className={`flex flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-[#d7e1e3] bg-[#f7f9f9] text-center ${compact ? "min-h-36" : "min-h-105"}`}>
            <AlarmClock className="mb-4 size-12 text-[#b6c2c6]" />
            <p className="text-xl font-semibold text-[#9aa8ad]">{label}</p>
        </div>
    )
}

function EnableSoundOverlay({
    onEnableSound,
}: {
    onEnableSound: () => void
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#16262f]/80 px-6 backdrop-blur-sm">
            <button
                type="button"
                onClick={onEnableSound}
                className="w-full max-w-lg rounded-[2rem] bg-white p-10 text-center shadow-2xl transition hover:scale-[1.01] active:scale-[0.99]"
            >
                <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-[#e7f1f2] text-[#2f6975]">
                    <Volume2 className="size-10" />
                </div>

                <h2 className="mb-3 text-4xl font-bold tracking-[-0.04em] text-[#16262f]">
                    Tap to enable sound
                </h2>
            </button>
        </div>
    )
}

function SoundSettingsDialog({
    selectedSoundPath,
    onSelectSound,
    onClose,
}: {
    selectedSoundPath: string
    onSelectSound: (soundPath: string) => void
    onClose: () => void
}) {

    const [pendingSoundPath, setPendingSoundPath] = useState(selectedSoundPath)

    async function previewSound(soundPath: string) {
        setPendingSoundPath(soundPath)

        const audio = new Audio(soundPath)
        audio.volume = 1

        try {
            await audio.play()
        } catch (error) {
            console.error("Unable to preview sound:", error)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#16262f]/40 px-6 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl">
                <h2 className="mb-2 text-3xl font-bold tracking-[-0.04em] text-[#16262f]">
                    Chime sound
                </h2>

                <p className="mb-6 text-base font-medium text-muted-foreground">
                    Choose the sound this dashboard plays for new check-ins.
                </p>

                <div className="grid grid-cols-2 gap-3">
                    {CHIME_SOUNDS.map((sound) => (
                        <button
                            key={sound.path}
                            type="button"
                            onClick={() => previewSound(sound.path)}
                            className={`cursor-pointer rounded-2xl border p-4 text-left font-bold transition ${pendingSoundPath === sound.path
                                ? "border-[#2f6975] bg-[#e7f1f2] text-[#2f6975]"
                                : "border-[#d7e1e3] bg-white text-[#16262f] hover:bg-[#f7f9f9]"
                                }`}
                        >
                            {sound.label}
                        </button>
                    ))}
                </div>

                <Button
                    className="mt-6 h-12 w-full rounded-2xl bg-[#2f6975] font-bold hover:bg-[#285a64]"
                    onClick={() => {
                        onSelectSound(pendingSoundPath)
                        onClose()
                    }}
                >
                    Done
                </Button>
            </div>
        </div>
    )
}

function formatWaitingLabel(elapsedSeconds: number) {
    if (elapsedSeconds < 60) {
        return `0:${String(elapsedSeconds).padStart(2, "0")}`
    }

    return `${Math.floor(elapsedSeconds / 60)} min`
}

function formatClosedLabel(checkIn: CheckIn, now: Date | null) {
    if (!checkIn.closed_at) return "Acknowledged"

    const elapsedSeconds = now ? Math.max(
        0,
        Math.floor((now.getTime() - new Date(checkIn.closed_at).getTime()) / 1000),
    ) : 0

    if (elapsedSeconds < 60) return "just now"

    return `${Math.floor(elapsedSeconds / 60)} min`
}

function formatServiceLabel(checkIn: CheckIn) {
    if (checkIn.visit_type === "appointment") return "Appointment"
    if (checkIn.service_type === "windshield") return "Windshield"
    if (checkIn.service_type === "rock_chip" && checkIn.payment_type === "cash") return "Rock Chip – Cash"
    if (checkIn.service_type === "rock_chip" && checkIn.payment_type === "insurance") return "Rock Chip – Insurance"
    if (checkIn.service_type === "other") return "Other Service"
    if (checkIn.service_type === "bell") return <span className="flex items-center gap-2"><BellRing className="size-5 stroke-2 stroke-yellow-500" />Help Requested</span>
    return "Walk-in"
}
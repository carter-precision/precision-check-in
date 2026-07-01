"use client"

import { useEffect, useState } from "react"
import {
    CalendarCheck,
    CarFront,
    CheckCircle2,
    ArrowLeft,
    CircleHelp,
    CreditCard,
    FileText,
    ShieldCheck,
    Undo2,
    Wrench,
    BellRing,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { createCheckInAction } from "@/app/actions/check-ins"

type StepId =
    | "welcome"
    | "appointment"
    | "serviceType"
    | "quoteTool"
    | "paymentType"
    | "name"
    | "rockChipCashAuthorization"
    | "rockChipInsuranceName"
    | "success"

type VisitType = "appointment" | "walk-in" | null
type ServiceType = "windshield" | "rock-chip" | "other" | null
type PaymentType = "cash" | "insurance" | null

type KioskData = {
    visitType: VisitType
    serviceType: ServiceType
    paymentType: PaymentType
    customerName: string
    phone: string
    repairAuthorized: boolean
}

const initialData: KioskData = {
    visitType: null,
    serviceType: null,
    paymentType: null,
    customerName: "",
    phone: "",
    repairAuthorized: false,
}

const INACTIVITY_WARNING_MS = 23_000
const INACTIVITY_RESET_MS = 7000

export function KioskFlow({ location }: { location: string }) {
    const [step, setStep] = useState<StepId>("welcome")
    const [history, setHistory] = useState<StepId[]>([])
    const [data, setData] = useState<KioskData>(initialData)
    const [clock, setClock] = useState("")
    const [lastActivityAt, setLastActivityAt] = useState(Date.now())
    const [showInactiveWarning, setShowInactiveWarning] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        function updateClock() {
            setClock(
                new Intl.DateTimeFormat("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                }).format(new Date()),
            )
        }

        updateClock()
        const interval = setInterval(updateClock, 30_000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (step !== "success") return

        const timeout = setTimeout(resetFlow, 7000)

        return () => clearTimeout(timeout)
    }, [step])

    useEffect(() => {
        function handleActivity() {
            if (showInactiveWarning) return

            setLastActivityAt(Date.now())
        }

        window.addEventListener("pointerdown", handleActivity)
        window.addEventListener("keydown", handleActivity)

        return () => {
            window.removeEventListener("pointerdown", handleActivity)
            window.removeEventListener("keydown", handleActivity)
        }
    }, [showInactiveWarning])

    useEffect(() => {
        if (step === "welcome" || step === "success") {
            setShowInactiveWarning(false)
            return
        }

        if (showInactiveWarning) return

        const elapsed = Date.now() - lastActivityAt
        const remaining = Math.max(0, INACTIVITY_WARNING_MS - elapsed)

        const warningTimeout = setTimeout(() => {
            setShowInactiveWarning(true)
        }, remaining)

        return () => clearTimeout(warningTimeout)
    }, [step, lastActivityAt, showInactiveWarning])

    useEffect(() => {
        if (!showInactiveWarning) return

        const resetTimeout = setTimeout(() => {
            resetFlow()
        }, INACTIVITY_RESET_MS)

        return () => clearTimeout(resetTimeout)
    }, [showInactiveWarning])

    function updateData(partial: Partial<KioskData>) {
        setData((current) => ({ ...current, ...partial }))
    }

    function goTo(nextStep: StepId, partial?: Partial<KioskData>) {
        if (partial) updateData(partial)

        setHistory((current) => [...current, step])
        setStep(nextStep)
    }

    function goBack() {
        setHistory((current) => {
            const previousStep = current.at(-1)

            if (!previousStep) {
                setStep("welcome")
                return []
            }

            setStep(previousStep)
            return current.slice(0, -1)
        })
    }

    function resetFlow() {
        setData(initialData)
        setHistory([])
        setShowInactiveWarning(false)
        setLastActivityAt(Date.now())
        setStep("welcome")
    }

    async function submitCheckIn() {
        if (isSubmitting) return

        setIsSubmitting(true)

        try {
            await createCheckInAction({
                locationSlug: location,
                customerName: data.customerName.trim(),
                phone: data.phone.trim() || undefined,
                visitType: data.visitType === "appointment" ? "appointment" : "walk_in",
                serviceType: data.serviceType === "rock-chip" ? "rock_chip" : data.serviceType,
                paymentType: data.paymentType,
                source: "kiosk",
            })

            setHistory([])
            setStep("success")
        } catch (error) {
            console.error("Failed to create check-in:", error)
            alert("Something went wrong. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <main className="min-h-screen bg-[#f7f9f9] text-[#1f2933]">
            <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 sm:px-8 md:px-12">
                <KioskHeader clock={clock} />

                <div className="flex flex-1 flex-col overflow-hidden px-8 pb-8 pt-6">
                    {step === "welcome" && (
                        <KioskStep>
                            <div className="flex flex-1 flex-col items-center justify-center text-center -mt-30">
                                <h1 className="mb-4 text-5xl font-semibold tracking-[-0.04em] text-[#16262f]">
                                    Happy to see you!
                                </h1>

                                <p className="mb-10 max-w-sm text-xl font-medium leading-snug text-[#60727f]">
                                    Let's get things rolling.
                                </p>

                                <Button
                                    className="h-20 w-70 rounded-full bg-[#2f6975] text-xl font-bold shadow-lg shadow-[#2f6975]/20 hover:bg-[#285a64]"
                                    onClick={() => goTo("appointment")}
                                >
                                    Tap to check in
                                </Button>
                            </div>
                        </KioskStep>
                    )}

                    {step === "appointment" && (
                        <KioskStep title="Do you have an appointment?">
                            <div className="grid gap-4">
                                <ChoiceButton
                                    icon={<CalendarCheck />}
                                    label="Yes, I have an appointment"
                                    description="We’ll let the shop know you’re here."
                                    onClick={() =>
                                        goTo("name", {
                                            visitType: "appointment",
                                            serviceType: null,
                                            paymentType: null,
                                        })
                                    }
                                />

                                <ChoiceButton
                                    icon={<CarFront />}
                                    label="No, I’m a walk-in"
                                    description="A technician will come assist you."
                                    onClick={() =>
                                        goTo("serviceType", {
                                            visitType: "walk-in",
                                            serviceType: null,
                                            paymentType: null,
                                        })
                                    }
                                />
                            </div>
                        </KioskStep>
                    )}

                    {step === "serviceType" && (
                        <KioskStep title="How can we help?">
                            <div className="grid gap-4">
                                <ChoiceButton
                                    icon={<ShieldCheck />}
                                    label="Windshield"
                                    description="For windshield service or replacement."
                                    onClick={() =>
                                        goTo("name", {
                                            serviceType: "windshield",
                                            paymentType: null,
                                        })
                                    }
                                />

                                <ChoiceButton
                                    icon={<Wrench />}
                                    label="Rock chip"
                                    description="Repair for small chips or cracks."
                                    onClick={() =>
                                        goTo("paymentType", {
                                            serviceType: "rock-chip",
                                            paymentType: null,
                                        })
                                    }
                                />

                                <ChoiceButton
                                    icon={<CircleHelp />}
                                    label="Something else"
                                    description="A technician will help sort it out."
                                    onClick={() =>
                                        goTo("name", {
                                            serviceType: "other",
                                            paymentType: null,
                                        })
                                    }
                                />
                            </div>
                        </KioskStep>
                    )}

                    {step === "quoteTool" && (
                        <KioskStep title="Let’s get your quote started">
                            <div className="rounded-[1.4rem] border border-dashed border-[#a9c7ce] bg-white p-8 text-center shadow-sm">
                                <FileText className="mx-auto mb-5 size-12 text-[#2f6975]" />
                                <h2 className="mb-3 text-2xl font-bold tracking-[-0.02em] text-[#16262f]">
                                    Quote tool placeholder
                                </h2>
                                <p className="mb-7 text-base font-medium leading-snug text-[#6f7f86]">
                                    We’ll connect this step to the windshield quote flow later.
                                </p>
                                <Button
                                    className="h-14 w-full rounded-2xl bg-[#2f6975] text-lg font-bold shadow-lg shadow-[#2f6975]/20 hover:bg-[#285a64]"
                                    onClick={() => goTo("name")}
                                >
                                    Continue for now
                                </Button>
                            </div>
                        </KioskStep>
                    )}

                    {step === "paymentType" && (
                        <KioskStep title="How would you like to pay?">
                            <div className="grid gap-4">
                                <ChoiceButton
                                    icon={<CreditCard />}
                                    label="Cash pay"
                                    description="You’ll pay directly for the repair."
                                    trailing={
                                        <div className="flex gap-4">
                                            <div className="text-3xl font-bold tracking-tight text-[#349c42] -mt-1">
                                                $65
                                            </div>
                                            <div className="flex flex-col text-xs text-[#6f7f86]">
                                                <span>First chip included</span>
                                                <span>$20 each additional</span>
                                            </div>
                                        </div>
                                    }
                                    onClick={() =>
                                        goTo("rockChipCashAuthorization", {
                                            paymentType: "cash",
                                            repairAuthorized: false,
                                        })
                                    }
                                />

                                <ChoiceButton
                                    icon={<ShieldCheck />}
                                    label="Insurance"
                                    description="Often covered at no cost."
                                    onClick={() =>
                                        goTo("rockChipInsuranceName", {
                                            paymentType: "insurance",
                                            repairAuthorized: false,
                                        })
                                    }
                                />
                            </div>
                        </KioskStep>
                    )}

                    {step === "name" && (
                        <KioskStep title="What’s your name?">
                            <div className="mt-8 space-y-5">
                                <Input
                                    value={data.customerName}
                                    onChange={(event) =>
                                        updateData({ customerName: event.target.value })
                                    }
                                    placeholder="Enter your name"
                                    className="h-16 rounded-2xl border-[#d7e1e3] bg-white text-center text-2xl font-semibold shadow-sm placeholder:text-[#9aa8ad]"
                                />

                                <Button
                                    className="h-16 w-full rounded-2xl bg-[#2f6975] text-xl font-bold shadow-lg shadow-[#2f6975]/20 hover:bg-[#285a64]"
                                    disabled={isSubmitting || data.customerName.trim().length < 2}
                                    onClick={submitCheckIn}
                                >
                                    {isSubmitting ? "Submitting..." : "Submit"}
                                </Button>

                                {/* <p className="text-center text-sm font-medium text-[#7c8b91]">
                                    We’ll use your name to pull up your account.
                                </p> */}
                            </div>
                        </KioskStep>
                    )}

                    {step === "rockChipCashAuthorization" && (
                        <KioskStep title="Repair Authorization">
                            <div className="mt-4 space-y-5">
                                <div className="rounded-[1.4rem] border border-[#d7e1e3] bg-white p-6 text-left shadow-sm">
                                    <p className="text-lg font-medium leading-relaxed text-[#60727f]">
                                        I authorize Precision Auto Glass to inspect and perform the agreed repair on my vehicle. Resin repairs improve appearance and structural integrity but may leave a faint blemish. I understand a chip can occasionally spread during repair, in which case a replacement may be recommended.
                                    </p>

                                    <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl bg-[#f7f9f9] p-4">
                                        <input
                                            type="checkbox"
                                            checked={data.repairAuthorized}
                                            onChange={(event) =>
                                                updateData({ repairAuthorized: event.target.checked })
                                            }
                                            className="mt-1 size-5 accent-[#2f6975]"
                                        />

                                        <span className="text-base font-bold leading-snug text-[#16262f]">
                                            I have read and agree to the repair authorization.
                                        </span>
                                    </label>
                                </div>

                                <Input
                                    value={data.customerName}
                                    onChange={(event) =>
                                        updateData({ customerName: event.target.value })
                                    }
                                    placeholder="Enter your name"
                                    className="h-16 rounded-2xl border-[#d7e1e3] bg-white text-center text-2xl font-semibold shadow-sm placeholder:text-[#9aa8ad]"
                                />

                                <Button
                                    className="h-16 w-full rounded-2xl bg-[#2f6975] text-xl font-bold shadow-lg shadow-[#2f6975]/20 hover:bg-[#285a64]"
                                    disabled={
                                        isSubmitting ||
                                        data.customerName.trim().length < 2 ||
                                        !data.repairAuthorized
                                    }
                                    onClick={submitCheckIn}
                                >
                                    {isSubmitting ? "Submitting..." : "Submit"}
                                </Button>
                            </div>
                        </KioskStep>
                    )}

                    {step === "rockChipInsuranceName" && (
                        <KioskStep>
                            <div className="mt-4 space-y-5">
                                <div className="flex flex-col items-center rounded-[1.4rem] border border-[#a9c7ce] bg-[#e7f1f2] p-6 text-center shadow-sm">
                                    <ShieldCheck className="mx-auto mb-4 size-10 text-[#2f6975]" />

                                    <p className="text-xl font-bold leading-snug text-[#16262f]">
                                        We’re thrilled to help you!
                                    </p>

                                    <p className="max-w-150 mt-3 text-lg font-medium leading-snug text-[#60727f]">
                                        Insurance rock chip setups can be a rather arduous process — but we’re here to make things as smooth as possible.
                                    </p>
                                </div>

                                <Input
                                    value={data.customerName}
                                    onChange={(event) =>
                                        updateData({ customerName: event.target.value })
                                    }
                                    placeholder="Enter your name"
                                    className="h-16 rounded-2xl border-[#d7e1e3] bg-white text-center text-2xl font-semibold shadow-sm placeholder:text-[#9aa8ad]"
                                />

                                <Button
                                    className="h-16 w-full rounded-2xl bg-[#2f6975] text-xl font-bold shadow-lg shadow-[#2f6975]/20 hover:bg-[#285a64]"
                                    disabled={isSubmitting || data.customerName.trim().length < 2}
                                    onClick={submitCheckIn}
                                >
                                    {isSubmitting ? "Submitting..." : "Submit"}
                                </Button>
                            </div>
                        </KioskStep>
                    )}

                    {step === "success" && (
                        <KioskStep>
                            <div className="flex flex-1 flex-col items-center justify-center text-center -mt-30">
                                <div className="mb-7 flex h-24 w-24 items-center justify-center rounded-full bg-[#e5f4ed] text-[#3b8d65]">
                                    <CheckCircle2 className="h-14 w-14" />
                                </div>

                                <h1 className="mb-4 text-5xl font-semibold tracking-[-0.04em] text-[#16262f]">
                                    You’re checked in
                                </h1>

                                <p className="max-w-sm text-xl font-medium leading-snug text-[#60727f]">
                                    A technician has been notified and will be with you shortly.
                                </p>
                            </div>
                        </KioskStep>
                    )}

                    {step !== "welcome" && step !== "appointment" && step !== "success" && (
                        <div className="flex items-center justify-between px-5 mb-2">
                            <Button
                                variant="ghost"
                                className="rounded-full border-4 px-4 text-[#60727f] text-md"
                                onClick={goBack}
                            >
                                <ArrowLeft className="size-5" />
                                Back
                            </Button>
                            <Button
                                variant="ghost"
                                className="rounded-full border-4 px-4 text-[#60727f] text-md"
                                onClick={resetFlow}
                            >
                                <Undo2 className="size-5" />
                                Restart
                            </Button>
                        </div>
                    )}

                    {["appointment"].includes(step) && (
                        <RingTeamButton
                            onClick={() => {
                                console.log("Ring team member:", { location })
                            }}
                        />
                    )}

                    {step === "rockChipInsuranceName" && (
                        <PayCashInsteadButton
                            onClick={() => {
                                updateData({
                                    paymentType: "cash",
                                    repairAuthorized: false,
                                })

                                setStep("rockChipCashAuthorization")
                            }}
                        />
                    )}
                </div>
            </div>
            {showInactiveWarning && (
                <InactivityWarning
                    onContinue={() => {
                        setShowInactiveWarning(false)
                        setLastActivityAt(Date.now())
                    }}
                    onReset={resetFlow}
                />
            )}
        </main>
    )
}

function KioskHeader({ clock }: { clock: string }) {
    return (
        <div className="flex items-center justify-between p-4">
            <Button
                variant="ghost"
                size="icon"
                className="text-[#60727f]"
                onClick={() => { }}
            >
                <FileText className="size-6" />
            </Button>

            <div className="text-sm font-semibold text-[#6f7f86]">
                {clock}
            </div>
        </div>
    )
}

function KioskStep({
    kicker,
    title,
    children,
}: {
    kicker?: string
    title?: string
    children: React.ReactNode
}) {
    return (
        <section className="flex flex-1 animate-in fade-in slide-in-from-bottom-3 duration-300 flex-col">
            {(kicker || title) && (
                <div className="mb-7 pt-16 text-center">
                    {kicker && (
                        <p className="mb-2 text-sm font-bold uppercase tracking-[0.24em] text-[#6f8c92]">
                            {kicker}
                        </p>
                    )}
                    {title && (
                        <h1 className="text-4xl font-semibold leading-tight tracking-[-0.04em] text-[#16262f]">
                            {title}
                        </h1>
                    )}
                </div>
            )}

            {children}
        </section>
    )
}

function ChoiceButton({
    icon,
    label,
    description,
    trailing,
    onClick,
}: {
    icon: React.ReactNode
    label: string
    description: string
    trailing?: React.ReactNode
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group flex min-h-28 w-full cursor-pointer items-center gap-4 rounded-[1.4rem] border border-[#d7e1e3] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#a9c7ce] hover:shadow-md active:translate-y-0"
        >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#e7f1f2] text-[#2f6975] transition group-hover:bg-[#dbecee]">
                <div className="[&_svg]:h-7 [&_svg]:w-7">
                    {icon}
                </div>
            </div>

            <div className="min-w-0 flex-1">
                <div className="text-xl font-bold tracking-[-0.02em] text-[#16262f]">
                    {label}
                </div>
                <div className="mt-1 text-base font-medium leading-snug text-[#6f7f86]">
                    {description}
                </div>
            </div>

            {trailing && (
                <div className="ml-4 shrink-0">
                    {trailing}
                </div>
            )}
        </button>
    )
}


function PayCashInsteadButton({ onClick }: { onClick: () => void }) {
    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center px-5">
            <Button
                className="pointer-events-auto h-14 rounded-full bg-white px-7 text-base font-bold text-[#2f6975] shadow-lg ring-1 ring-[#d7e1e3] hover:bg-[#eef6f7]"
                onClick={onClick}
            >
                <CreditCard className="size-5" />
                Pay cash instead
            </Button>
        </div>
    )
}

function RingTeamButton({ onClick }: { onClick: () => void }) {
    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center px-5">
            <Button
                className="pointer-events-auto h-14 rounded-full bg-white px-7 text-base font-bold text-[#2f6975] shadow-lg ring-1 ring-[#d7e1e3] hover:bg-[#eef6f7]"
                onClick={onClick}
            >
                <BellRing className="size-5" />
                Ring for a team member
            </Button>
        </div>
    )
}

function InactivityWarning({
    onContinue,
    onReset,
}: {
    onContinue: () => void
    onReset: () => void
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#16262f]/30 px-6 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-2xl">
                <div className="absolute right-5 top-5">
                    <CountdownPie durationMs={INACTIVITY_RESET_MS} />
                </div>

                <h2 className="mb-3 text-3xl font-bold tracking-[-0.04em] text-[#16262f]">
                    Are you still there?
                </h2>

                <p className="mb-7 text-lg font-medium leading-snug text-[#60727f]">
                    Tap continue to keep checking in.
                </p>

                <div className="grid gap-3">
                    <Button
                        className="h-14 rounded-2xl bg-[#2f6975] text-lg font-bold shadow-lg shadow-[#2f6975]/20 hover:bg-[#285a64]"
                        onClick={onContinue}
                    >
                        Continue
                    </Button>

                    <Button
                        variant="outline"
                        className="h-14 rounded-2xl border-[#d7e1e3] text-lg font-bold text-[#60727f]"
                        onClick={onReset}
                    >
                        Start over
                    </Button>
                </div>
            </div>
        </div>
    )
}

function CountdownPie({ durationMs }: { durationMs: number }) {
    const radius = 18
    const circumference = 2 * Math.PI * radius

    return (
        <svg className="-rotate-90 size-6" viewBox="0 0 44 44">
            <circle
                cx="22"
                cy="22"
                r={radius}
                fill="none"
                stroke="#e7f1f2"
                strokeWidth="8"
            />
            <circle
                cx="22"
                cy="22"
                r={radius}
                fill="none"
                stroke="#6f7f86"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset="0"
                style={{
                    animation: `countdown-ring ${durationMs}ms linear forwards`,
                }}
            />
        </svg>
    )
}
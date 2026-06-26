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
    Sparkles,
    Undo2,
    Wrench,
    BellRing,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PrecisionLogo } from "../ui/logo"

type StepId =
    | "welcome"
    | "appointment"
    | "serviceType"
    | "quoteTool"
    | "paymentType"
    | "name"
    | "nameAndPhone"
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
}

const initialData: KioskData = {
    visitType: null,
    serviceType: null,
    paymentType: null,
    customerName: "",
    phone: "",
}

export function KioskFlow({ location }: { location: string }) {
    const [step, setStep] = useState<StepId>("welcome")
    const [history, setHistory] = useState<StepId[]>([])
    const [data, setData] = useState<KioskData>(initialData)
    const [clock, setClock] = useState("")

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
        setStep("welcome")
    }

    function submitCheckIn() {
        console.log("Demo check-in:", {
            location,
            customerName: data.customerName.trim(),
            phone: data.phone.trim(),
            visitType: data.visitType,
            serviceType: data.serviceType,
            paymentType: data.paymentType,
        })

        setHistory([])
        setStep("success")
    }

    return (
        <main className="min-h-screen bg-[#f7f9f9] text-[#1f2933]">
            <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 sm:px-8 md:px-12">
                <KioskHeader clock={clock} />

                <div className="flex flex-1 flex-col overflow-hidden px-8 pb-8 pt-6">
                    {step === "welcome" && (
                        <KioskStep>
                            <div className="flex flex-1 flex-col items-center justify-center text-center -mt-50">
                                <div className="mb-10 flex size-22 items-center justify-center rounded-full bg-[#e7f1f2] text-[#2f6975]">
                                    <Sparkles className="size-12" />
                                </div>

                                <h1 className="mb-4 text-5xl font-semibold tracking-[-0.04em] text-[#16262f]">
                                    Happy to see you!
                                </h1>

                                <p className="mb-10 max-w-sm text-xl font-medium leading-snug text-[#60727f]">
                                    Let's get things rolling.
                                </p>

                                <Button
                                    className="h-20 w-90 rounded-2xl bg-[#2f6975] text-xl font-bold shadow-lg shadow-[#2f6975]/20 hover:bg-[#285a64]"
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
                                        goTo("quoteTool", {
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
                                            <div className="text-xs text-[#6f7f86]">
                                                First chip included<br />
                                                $20 each additional
                                            </div>
                                        </div>
                                    }
                                    onClick={() =>
                                        goTo("name", {
                                            paymentType: "cash",
                                        })
                                    }
                                />

                                <ChoiceButton
                                    icon={<ShieldCheck />}
                                    label="Insurance"
                                    description="Often covered at no cost."
                                    onClick={() =>
                                        goTo("nameAndPhone", {
                                            paymentType: "insurance",
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
                                    autoFocus
                                    value={data.customerName}
                                    onChange={(event) =>
                                        updateData({ customerName: event.target.value })
                                    }
                                    placeholder="Enter your name"
                                    className="h-16 rounded-2xl border-[#d7e1e3] bg-white text-center text-2xl font-semibold shadow-sm placeholder:text-[#9aa8ad]"
                                />

                                <Button
                                    className="h-16 w-full rounded-2xl bg-[#2f6975] text-xl font-bold shadow-lg shadow-[#2f6975]/20 hover:bg-[#285a64]"
                                    disabled={data.customerName.trim().length < 2}
                                    onClick={submitCheckIn}
                                >
                                    Notify Technician
                                </Button>

                                <p className="text-center text-sm font-medium text-[#7c8b91]">
                                    We’ll use your name to pull up your account.
                                </p>
                            </div>
                        </KioskStep>
                    )}

                    {step === "nameAndPhone" && (
                        <KioskStep title="What’s your name and phone number?">
                            <div className="mt-8 space-y-5">
                                <Input
                                    autoFocus
                                    value={data.customerName}
                                    onChange={(event) =>
                                        updateData({ customerName: event.target.value })
                                    }
                                    placeholder="Enter your name"
                                    className="h-16 rounded-2xl border-[#d7e1e3] bg-white text-center text-2xl font-semibold shadow-sm placeholder:text-[#9aa8ad]"
                                />

                                <Input
                                    value={data.phone}
                                    onChange={(event) => updateData({ phone: event.target.value })}
                                    placeholder="Enter your phone number"
                                    inputMode="tel"
                                    className="h-16 rounded-2xl border-[#d7e1e3] bg-white text-center text-2xl font-semibold shadow-sm placeholder:text-[#9aa8ad]"
                                />

                                <Button
                                    className="h-16 w-full rounded-2xl bg-[#2f6975] text-xl font-bold shadow-lg shadow-[#2f6975]/20 hover:bg-[#285a64]"
                                    disabled={
                                        data.customerName.trim().length < 2 ||
                                        data.phone.trim().length < 7
                                    }
                                    onClick={submitCheckIn}
                                >
                                    Notify Technician
                                </Button>

                                <p className="text-center text-sm font-medium text-[#7c8b91]">
                                    {/* We’ll use this to pull up your account or insurance details. */}
                                    Reason for collecting phone here? Who collects insurance info?<br />
                                    Add longer form?
                                </p>
                            </div>
                        </KioskStep>
                    )}

                    {step === "success" && (
                        <KioskStep>
                            <div className="flex flex-1 flex-col items-center justify-center text-center">
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

                    {step !== "welcome" && step !== "success" && (
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

                    {["welcome", "appointment"].includes(step) && (
                        < RingTeamButton
                            onClick={() => {
                                console.log("Ring team member:", { location })
                            }}
                        />
                    )}
                </div>
            </div>
        </main>
    )
}

function KioskHeader({ clock }: { clock: string }) {
    return (
        <div className="flex items-center justify-between px-7 pb-3 pt-5">
            <div className="flex items-center gap-3">
                <PrecisionLogo />
            </div>

            <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold tabular-nums text-[#6f7f86] shadow-sm">
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
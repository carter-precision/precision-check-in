"use client"

import { useState } from "react"
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    ClipboardList,
    Info,
    ShieldAlert,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

type FlowRole = "Tech" | "Customer" | "Manager" | "Quality Control"

type FlowStep = {
    roles: FlowRole[]
    action: string
    warning?: string
    branch?: {
        roles: FlowRole[]
        action: string
    }
}

type ShopFlow = {
    id: string
    label: string
    summary: string
    steps: FlowStep[]
}

const SHOP_FLOWS: ShopFlow[] = [
    {
        id: "rock-chip-cash",
        label: "Rock Chip — Cash",
        summary: "Inspect, create the job, complete the repair, and collect payment.",
        steps: [
            {
                roles: ["Tech"],
                action: "Inspect the chip and determine whether it needs a repair or replacement.",
            },
            {
                roles: ["Customer", "Tech"],
                action: "Return to the kiosk with the customer and have them complete the rock chip quote. This creates the job and adds it to the schedule.",
            },
            {
                roles: ["Tech"],
                action: "Complete the repair while the customer fills out the form.",
            },
            {
                roles: ["Tech"],
                action: "Return the vehicle, check out the customer, and collect payment.",
            },
        ],
    },
    {
        id: "rock-chip-insurance",
        label: "Rock Chip — Insurance",
        summary: "Guide the customer through filing and verifying their own insurance claim.",
        steps: [
            {
                roles: ["Tech"],
                action: "Inspect the chip and determine whether it needs a repair or replacement.",
            },
            {
                roles: ["Customer", "Tech"],
                action: "Direct the customer to file their claim with insurance and give them the office number: 801-520-3131",
            },
            {
                roles: ["Customer"],
                action: "Contact the insurance group by phone, mobile app, or website. File the claim, then call the office to verify a same-day appointment.",
                warning: "The customer must set up and confirm the claim—the claim is not staff-initiated.",
            },
            {
                roles: ["Customer", "Tech"],
                action: "Explain that after the claim is completed and verified with the office, the customer can check in again as an appointment and the team will complete the work.",
            },
        ],
    },
    {
        id: "quote-inquiry",
        label: "Quote Inquiry",
        summary: "The customer submits a kiosk form and the office handles follow-up.",
        steps: [
            {
                roles: ["Customer"],
                action: "Fill out the quote form at the kiosk.",
                warning: "The office follows up by phone to book the job. Nothing else is needed from the on-site team.",
            },
        ],
    },
    {
        id: "warranty-issue",
        label: "Warranty Issue",
        summary: "Resolve on-site when possible, consult Quality Control, and hand off cleanly.",
        steps: [
            {
                roles: ["Manager"],
                action: "Attempt to resolve the issue on-site.",
            },
            {
                roles: ["Manager"],
                action: "Troubleshoot the fix and communicate with the customer. Verify with a supervisor if the cost to correct the issue exceeds $300.",
                branch: {
                    roles: ["Manager", "Quality Control"],
                    action: "If you are unsure what to do, consult with Quality Control and/or hand the job off to them for the fix.",
                },
            },
            {
                roles: ["Manager"],
                action: "Escalate to Purchasing for scheduling with the customer. Make sure the handoff is clean and thorough.",
            },
        ],
    },
    {
        id: "appointment",
        label: "Appointment",
        summary: "Inspect, set expectations, communicate delays, and complete Dispatch notes.",
        steps: [
            {
                roles: ["Tech"],
                action: "Handle the customer directly; complete the inspection at the vehicle.",
            },
            {
                roles: ["Tech"],
                action: "Confirm whether the customer is waiting on-site or leaving the vehicle.",
            },
            {
                roles: ["Tech"],
                action: "Check in with the customer right before the windshield is set and give them an ETA.",
            },
            {
                roles: ["Tech"],
                action: "If the installation runs long, proactively update the customer.",
                warning: "Non-negotiable: never let a customer wait 45+ minutes without an update.",
            },
            {
                roles: ["Tech"],
                action: "Communicate with the customer and fill out the Dispatch notes.",
            },
        ],
    },
]

const ROLE_STYLES: Record<FlowRole, string> = {
    Tech: "bg-[#e7f1f2] text-[#2f6975]",
    Customer: "bg-[#e5f4ed] text-[#3b8d65]",
    Manager: "bg-[#fff1e8] text-[#a34f32]",
    "Quality Control": "bg-[#eeeafa] text-[#625695]",
}

export function ShopFlowGuide({
    open,
    onOpenChange,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null)
    const selectedFlow = SHOP_FLOWS.find((flow) => flow.id === selectedFlowId)

    function handleOpenChange(nextOpen: boolean) {
        onOpenChange(nextOpen)

        if (!nextOpen) {
            setSelectedFlowId(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="flex h-[min(760px,calc(100vh-2rem))] sm:max-w-6xl flex-col gap-0 overflow-hidden rounded-[2rem] border border-[#d7e1e3] p-0 text-[#1f2933] shadow-2xl" showCloseButton>
                <DialogHeader className="shrink-0 border-b border-[#d7e1e3] bg-white px-6 py-5 pr-16 sm:px-8 sm:py-6">
                    <div className="mb-1 flex items-center gap-2 text-sm font-black uppercase tracking-[0.06em] text-[#2f6975]">
                        <ClipboardList className="size-4" />
                        Shop flow quick reference
                    </div>
                    <DialogTitle className="text-2xl font-bold tracking-[-0.03em] text-[#16262f] sm:text-3xl">
                        {selectedFlow?.label ?? "What is the customer here for?"}
                    </DialogTitle>
                    <DialogDescription className="text-sm font-medium text-[#6f7f86] sm:text-base">
                        {selectedFlow
                            ? selectedFlow.summary
                            : "Choose the situation below to see the recommended response."}
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto bg-[#f7f9f9]">
                    {selectedFlow ? (
                        <FlowDetails flow={selectedFlow} onBack={() => setSelectedFlowId(null)} />
                    ) : (
                        <FlowPicker onSelect={setSelectedFlowId} />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function FlowPicker({ onSelect }: { onSelect: (flowId: string) => void }) {
    return (
        <div className="grid gap-3 p-5 sm:grid-cols-2 sm:gap-4 sm:p-8">
            {SHOP_FLOWS.map((flow, index) => (
                <button
                    key={flow.id}
                    type="button"
                    onClick={() => onSelect(flow.id)}
                    className="group flex cursor-pointer items-start gap-4 rounded-[1.4rem] border border-[#d7e1e3] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#2f6975]/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#2f6975]/25"
                >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#e7f1f2] text-base font-black text-[#2f6975]">
                        {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="mb-1 block text-lg font-bold tracking-[-0.02em] text-[#16262f] sm:text-xl">
                            {flow.label}
                        </span>
                        <span className="block text-sm font-medium leading-relaxed text-[#6f7f86]">
                            {flow.summary}
                        </span>
                    </span>
                    <ArrowRight className="mt-2 size-5 shrink-0 text-[#9aa8ad] transition group-hover:translate-x-0.5 group-hover:text-[#2f6975]" />
                </button>
            ))}
        </div>
    )
}

function FlowDetails({ flow, onBack }: { flow: ShopFlow; onBack: () => void }) {
    return (
        <div className="mx-auto w-full max-w-3xl p-5 sm:p-8">
            <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                className="mb-5 -ml-2 h-10 rounded-xl px-3 font-bold text-[#2f6975] hover:bg-[#e7f1f2] hover:text-[#285a64]"
            >
                <ArrowLeft className="size-4" />
                All flows
            </Button>

            <ol className="space-y-3">
                {flow.steps.map((step, index) => (
                    <li key={`${flow.id}-${index}`} className="relative flex gap-4 sm:gap-5">
                        {index < flow.steps.length - 1 && (
                            <div className="absolute left-5 top-10 h-[calc(100%+0.75rem)] w-px bg-[#cbd8db]" aria-hidden="true" />
                        )}

                        <div className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-[#2f6975] text-sm font-black text-white shadow-sm">
                            {index + 1}
                        </div>

                        <div className="mb-2 min-w-0 flex-1 rounded-[1.4rem] border border-[#d7e1e3] bg-white p-5 shadow-sm sm:p-6">
                            <div className="mb-3 flex flex-wrap gap-2">
                                {step.roles.map((role) => (
                                    <RoleBadge key={role} role={role} />
                                ))}
                            </div>

                            <p className="text-base font-semibold leading-relaxed text-[#243640] sm:text-lg">
                                {step.action}
                            </p>

                            {step.warning && (
                                <div className="mt-4 flex gap-3 rounded-xl border border-[#f1c7b8] bg-[#fff1e8] p-4 text-sm font-bold leading-relaxed text-[#8d3f27] sm:text-base">
                                    <ShieldAlert className="mt-0.5 size-5 shrink-0" />
                                    <span>{step.warning}</span>
                                </div>
                            )}

                            {step.branch && (
                                <div className="mt-4 rounded-xl border border-dashed border-[#9eb9bf] bg-[#eef5f6] p-4">
                                    <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.08em] text-[#2f6975]">
                                        <Info className="size-4" />
                                        If needed
                                    </div>
                                    <div className="mb-3 flex flex-wrap gap-2">
                                        {step.branch.roles.map((role) => (
                                            <RoleBadge key={role} role={role} />
                                        ))}
                                    </div>
                                    <p className="text-sm font-semibold leading-relaxed text-[#38515b] sm:text-base">
                                        {step.branch.action}
                                    </p>
                                </div>
                            )}
                        </div>
                    </li>
                ))}
            </ol>

            <div className="mt-5 flex items-center justify-center gap-2 text-sm font-bold text-[#3b8d65]">
                <CheckCircle2 className="size-5" />
                Flow complete
            </div>
        </div>
    )
}

function RoleBadge({ role }: { role: FlowRole }) {
    return (
        <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.06em] ${ROLE_STYLES[role]}`}>
            {role}
        </span>
    )
}

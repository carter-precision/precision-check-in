"use client"

import { useActionState } from "react"
import { Building2, CarFront, CheckCircle2, LoaderCircle } from "lucide-react"

import {
    createCustomerCheckInAction,
    type CustomerCheckInActionState,
} from "@/app/actions/check-ins"

const initialCustomerCheckInActionState: CustomerCheckInActionState = {
    status: "idle",
}

export function CustomerCheckInForm({
    proof,
    customerName,
    vehicleDescription,
    preview = false,
}: {
    proof: string
    customerName: string
    vehicleDescription: string | null
    preview?: boolean
}) {
    const [state, action, isPending] = useActionState(
        preview ? completePreviewCheckIn : createCustomerCheckInAction,
        initialCustomerCheckInActionState,
    )

    if (state.status === "success") {
        return (
            <div className="animate-in fade-in zoom-in-95 py-8 text-center duration-300" role="status">
                <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-[#e9f5e3] text-accent">
                    <CheckCircle2 className="size-11" strokeWidth={2.5} />
                </div>
                <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#16262f]">You&apos;re checked in</h1>
                <p className="mx-auto mt-3 max-w-sm text-lg font-medium leading-relaxed text-muted-foreground">
                    {state.message}
                </p>
            </div>
        )
    }

    return (
        <form action={action} className="space-y-4">
            <input type="hidden" name="proof" value={proof} />

            <div className="mb-7 text-center">
                {/* <p className="text-sm font-bold uppercase tracking-[0.16em] text-accent">Welcome, {firstName(customerName)}</p> */}
                <p className="mt-3 text-xl font-medium text-accent">
                    Welcome, {firstName(customerName)}
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#16262f]">Where are you waiting?</h1>
                <p className="mt-3 text-base font-medium text-muted-foreground">
                    Choose one option to let our team know you&apos;re here.
                </p>
            </div>

            <ArrivalButton
                name="arrivalMode"
                value="lobby"
                icon={<Building2 />}
                label="I'm in the lobby"
                description="We'll come greet you inside."
                disabled={isPending}
            />

            <ArrivalButton
                name="arrivalMode"
                value="vehicle"
                icon={<CarFront />}
                label="I'm waiting in my vehicle"
                description={
                    vehicleDescription
                        ? `We'll look for your ${vehicleDescription}.`
                        : "Vehicle information isn't available. Please check in inside."
                }
                disabled={isPending || !vehicleDescription}
            />

            {isPending && (
                <div className="flex items-center justify-center gap-2 pt-3 text-sm font-bold text-muted-foreground" role="status">
                    <LoaderCircle className="size-4 animate-spin" />
                    Checking you in…
                </div>
            )}

            {state.status === "error" && (
                <div className="rounded-2xl border border-[#efcaca] bg-[#fff4f4] px-4 py-3 text-center text-sm font-semibold leading-relaxed text-[#8f3434]" role="alert">
                    {state.message}
                </div>
            )}
        </form>
    )
}

function ArrivalButton({
    icon,
    label,
    description,
    ...props
}: React.ComponentProps<"button"> & {
    icon: React.ReactNode
    label: string
    description: string
}) {
    return (
        <button
            type="submit"
            className="group flex min-h-28 w-full cursor-pointer items-center gap-4 rounded-[1.4rem] border border-[#d7e1e3] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#a9c7ce] hover:shadow-md active:translate-y-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55"
            {...props}
        >
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent-tint text-accent [&_svg]:size-7">
                {icon}
            </div>
            <div>
                <div className="text-xl font-bold tracking-[-0.02em] text-[#16262f]">{label}</div>
                <div className="mt-1 text-base font-medium leading-snug text-muted-foreground">{description}</div>
            </div>
        </button>
    )
}

function firstName(customerName: string) {
    return customerName.trim().split(/\s+/)[0] || customerName
}

async function completePreviewCheckIn(): Promise<CustomerCheckInActionState> {
    return {
        status: "success",
        message: "Preview complete. No check-in was created.",
    }
}

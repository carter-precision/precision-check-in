import type { Metadata } from "next"

import { CheckInShell, CheckInTooEarly, CheckInUnavailable } from "@/components/check-in/CheckInShell"
import { CustomerCheckInForm } from "@/components/check-in/CustomerCheckInForm"
import { createCustomerCheckInProof } from "@/lib/auth/customer-check-in-proof"
import { getLocationBySlug } from "@/lib/data/locations"
import { resolveOmegaAppointment } from "@/lib/omega/appointment-resolver"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
    title: "Appointment Check-in | Precision Auto Glass",
    description: "Let the Precision Auto Glass team know you have arrived.",
    referrer: "no-referrer",
    robots: {
        index: false,
        follow: false,
    },
}

export default async function CheckInPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
    const query = await searchParams
    const appointmentGuid = firstQueryValue(query.appointment_guid)
    const invoiceId = firstQueryValue(query.invoice_id)

    if (process.env.NODE_ENV === "development" && firstQueryValue(query.preview) === "1") {
        return (
            <CheckInShell>
                <CustomerCheckInForm
                    proof="development-preview"
                    customerName="Jordan Example"
                    vehicleDescription="2024 Toyota Camry White"
                    preview
                />
            </CheckInShell>
        )
    }

    if (process.env.NODE_ENV === "development" && firstQueryValue(query.preview) === "2") {
        return <CheckInTooEarly />
    }

    if (!appointmentGuid || !invoiceId) {
        return <CheckInUnavailable />
    }

    const resolution = await resolveOmegaAppointment({
        appointmentGuid,
        invoiceId,
    })

    if (resolution.status === "too_early") {
        return <CheckInTooEarly />
    }

    if (resolution.status !== "resolved") {
        return <CheckInUnavailable />
    }

    try {
        await getLocationBySlug(resolution.appointment.locationSlug)
    } catch {
        return <CheckInUnavailable />
    }

    let proof: string

    try {
        proof = createCustomerCheckInProof(resolution.appointment)
    } catch (error) {
        console.error("Customer check-in proof could not be created", error)
        return <CheckInUnavailable />
    }

    return (
        <CheckInShell>
            <CustomerCheckInForm
                proof={proof}
                customerName={resolution.appointment.customerName}
                vehicleDescription={resolution.appointment.vehicleDescription}
            />
        </CheckInShell>
    )
}

function firstQueryValue(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value
}

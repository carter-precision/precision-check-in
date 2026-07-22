import "server-only"

import crypto from "node:crypto"
import { z } from "zod"

import type { VerifiedAppointment } from "@/lib/omega/types"

const proofSchema = z.object({
    omegaAppointmentId: z.string().min(1),
    omegaInvoiceId: z.string().min(1),
    appointmentGuidHash: z.string().length(64),
    customerName: z.string().min(1).max(200),
    phone: z.string().max(50).nullable(),
    vehicleDescription: z.string().max(300).nullable(),
    appointmentStart: z.number(),
    appointmentEnd: z.number(),
    locationSlug: z.string().regex(/^[a-z0-9-]+$/),
    expiresAt: z.number(),
})

export type CustomerCheckInProof = z.infer<typeof proofSchema>

const PROOF_TTL_MS = 20 * 60 * 1_000

export function createCustomerCheckInProof(appointment: VerifiedAppointment) {
    const payload = Buffer.from(
        JSON.stringify({
            ...appointment,
            expiresAt: Date.now() + PROOF_TTL_MS,
        } satisfies CustomerCheckInProof),
        "utf8",
    )
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv("aes-256-gcm", getProofKey(), iv)
    const ciphertext = Buffer.concat([cipher.update(payload), cipher.final()])
    const tag = cipher.getAuthTag()

    return [iv, tag, ciphertext].map((part) => part.toString("base64url")).join(".")
}

export function readCustomerCheckInProof(proof: string): CustomerCheckInProof | null {
    try {
        const parts = proof.split(".")

        if (parts.length !== 3) return null

        const [ivEncoded, tagEncoded, ciphertextEncoded] = parts
        const decipher = crypto.createDecipheriv(
            "aes-256-gcm",
            getProofKey(),
            Buffer.from(ivEncoded, "base64url"),
        )
        decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"))
        const plaintext = Buffer.concat([
            decipher.update(Buffer.from(ciphertextEncoded, "base64url")),
            decipher.final(),
        ])
        const parsed = proofSchema.safeParse(JSON.parse(plaintext.toString("utf8")))

        if (!parsed.success || parsed.data.expiresAt < Date.now()) return null

        return parsed.data
    } catch {
        return null
    }
}

function getProofKey() {
    const secret = process.env.CHECK_IN_PROOF_SECRET?.trim()

    if (!secret || secret.length < 32) {
        throw new Error("CHECK_IN_PROOF_SECRET must contain at least 32 characters")
    }

    return crypto.createHash("sha256").update(secret).digest()
}

"use server"

import {
    closeCheckIn,
    createCheckIn,
    type CreateCheckInInput,
} from "@/lib/data/check-ins"

export async function createCheckInAction(input: CreateCheckInInput) {
    return createCheckIn(input)
}

export async function closeCheckInAction(id: string) {
    return closeCheckIn(id)
}
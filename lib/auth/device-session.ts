import { cookies } from "next/headers"

export const DEVICE_COOKIE_NAME = "pag_device_token"

export async function setDeviceCookie(token: string) {
    const cookieStore = await cookies()

    cookieStore.set(DEVICE_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
    })
}

export async function getDeviceCookie() {
    const cookieStore = await cookies()
    return cookieStore.get(DEVICE_COOKIE_NAME)?.value
}
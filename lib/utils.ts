// shadcn

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Device Tokens

import crypto from "node:crypto"

export function generateDeviceToken() {
  return crypto.randomBytes(32).toString("hex")
}

export function hashDeviceToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}
import "server-only"

import crypto from "node:crypto"

export function generateDeviceToken() {
  return crypto.randomBytes(32).toString("hex")
}

export function hashDeviceToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

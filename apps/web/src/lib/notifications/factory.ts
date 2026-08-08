import type { EmailSender, SmsSender } from "./provider"
import { LogSender } from "./provider"
import { TermiiSmsSender } from "./termii"
import { ResendEmailSender } from "./resend"

/** Falls back to logging instead of sending when the provider's API key isn't configured yet. */
export function getSmsSender(): SmsSender {
  const apiKey = process.env.TERMII_API_KEY
  const senderId = process.env.TERMII_SENDER_ID
  if (!apiKey || !senderId) {
    return new LogSender()
  }
  return new TermiiSmsSender(apiKey, senderId)
}

export function getEmailSender(): EmailSender {
  const apiKey = process.env.RESEND_API_KEY
  const fromAddress = process.env.RESEND_FROM_ADDRESS
  if (!apiKey || !fromAddress) {
    return new LogSender()
  }
  return new ResendEmailSender(apiKey, fromAddress)
}

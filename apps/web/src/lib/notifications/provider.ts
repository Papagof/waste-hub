export interface SendResult {
  ok: boolean
  error?: string
}

export interface SmsSender {
  send(to: string, message: string): Promise<SendResult>
}

export interface EmailSender {
  send(to: string, subject: string, body: string): Promise<SendResult>
}

/** Fallback used whenever a provider API key isn't configured — writes to the server log instead of failing. */
export class LogSender implements SmsSender, EmailSender {
  async send(to: string, messageOrSubject: string, body?: string): Promise<SendResult> {
    if (body !== undefined) {
      console.log(`[notifications] (no RESEND_API_KEY) email to ${to} — ${messageOrSubject}\n${body}`)
    } else {
      console.log(`[notifications] (no TERMII_API_KEY) sms to ${to} — ${messageOrSubject}`)
    }
    return { ok: true }
  }
}

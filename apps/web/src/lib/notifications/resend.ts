import type { EmailSender, SendResult } from "./provider"

const RESEND_BASE_URL = "https://api.resend.com"

export class ResendEmailSender implements EmailSender {
  constructor(
    private readonly apiKey: string,
    private readonly fromAddress: string,
  ) {}

  async send(to: string, subject: string, body: string): Promise<SendResult> {
    const res = await fetch(`${RESEND_BASE_URL}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.fromAddress,
        to: [to],
        subject,
        text: body,
      }),
    })
    if (!res.ok) {
      const errBody = (await res.json().catch(() => ({}))) as { message?: string }
      return { ok: false, error: errBody.message ?? `Resend request failed (${res.status})` }
    }
    return { ok: true }
  }
}

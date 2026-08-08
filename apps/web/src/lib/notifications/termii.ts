import type { SendResult, SmsSender } from "./provider"

const TERMII_BASE_URL = "https://api.ng.termii.com/api"

export class TermiiSmsSender implements SmsSender {
  constructor(
    private readonly apiKey: string,
    private readonly senderId: string,
  ) {}

  async send(to: string, message: string): Promise<SendResult> {
    const res = await fetch(`${TERMII_BASE_URL}/sms/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: this.apiKey,
        to,
        from: this.senderId,
        sms: message,
        type: "plain",
        channel: "generic",
      }),
    })
    const body = (await res.json()) as { message_id?: string; message?: string }
    if (!res.ok || !body.message_id) {
      return { ok: false, error: body.message ?? `Termii request failed (${res.status})` }
    }
    return { ok: true }
  }
}

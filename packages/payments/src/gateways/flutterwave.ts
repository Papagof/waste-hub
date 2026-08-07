import { createHash } from "node:crypto"
import type {
  CreateDedicatedVirtualAccountParams,
  DedicatedVirtualAccount,
  InitializeTransactionParams,
  InitializeTransactionResult,
  PaymentGatewayClient,
  TransactionStatus,
  VerifyTransactionResult,
  WebhookEvent,
} from "../gateway.interface"

const FLUTTERWAVE_BASE_URL = "https://api.flutterwave.com/v3"

function mapStatus(status: string): TransactionStatus {
  if (status === "successful" || status === "success") return "success"
  if (status === "failed") return "failed"
  return "pending"
}

export interface FlutterwaveConfig {
  secretKey: string
  /** Set on the Flutterwave dashboard; used to authenticate incoming webhooks. */
  webhookSecretHash: string
}

export class FlutterwaveGateway implements PaymentGatewayClient {
  readonly name = "flutterwave" as const

  constructor(private readonly config: FlutterwaveConfig) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${FLUTTERWAVE_BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.config.secretKey}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    })
    const body = (await res.json()) as { status: string; message: string; data: T }
    if (!res.ok || body.status !== "success") {
      throw new Error(`Flutterwave request failed: ${body.message ?? res.statusText}`)
    }
    return body.data
  }

  async initializeTransaction(
    params: InitializeTransactionParams,
  ): Promise<InitializeTransactionResult> {
    const data = await this.request<{ link: string }>("/payments", {
      method: "POST",
      body: JSON.stringify({
        tx_ref: params.reference,
        amount: params.amountKobo / 100,
        currency: "NGN",
        redirect_url: params.callbackUrl,
        customer: { email: params.email },
        meta: params.metadata,
      }),
    })
    return {
      reference: params.reference,
      authorizationUrl: data.link,
      raw: data,
    }
  }

  async verifyTransaction(reference: string): Promise<VerifyTransactionResult> {
    const data = await this.request<{
      status: string
      amount: number
      created_at: string
      tx_ref: string
    }>(`/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`)
    return {
      reference: data.tx_ref,
      status: mapStatus(data.status),
      amountKobo: Math.round(data.amount * 100),
      paidAt: data.status === "successful" ? data.created_at : null,
      raw: data,
    }
  }

  /** Flutterwave webhooks authenticate via a shared secret hash header, not an HMAC signature. */
  verifyWebhookSignature(_rawBody: string, signatureHeader: string): boolean {
    return signatureHeader === this.config.webhookSecretHash
  }

  parseWebhookEvent(rawBody: string): WebhookEvent {
    const payload = JSON.parse(rawBody) as {
      data: { tx_ref: string; status: string; amount: number }
    }
    return {
      reference: payload.data.tx_ref,
      status: mapStatus(payload.data.status),
      amountKobo: Math.round(payload.data.amount * 100),
      raw: payload,
    }
  }

  async createDedicatedVirtualAccount(
    params: CreateDedicatedVirtualAccountParams,
  ): Promise<DedicatedVirtualAccount> {
    const account = await this.request<{
      account_number: string
      bank_name: string
      note: string
    }>("/virtual-account-numbers", {
      method: "POST",
      body: JSON.stringify({
        email: params.email,
        is_permanent: true,
        bvn: undefined,
        tx_ref: `vacct-${params.residentId}-${createHash("sha1").update(params.residentId).digest("hex").slice(0, 8)}`,
        narration: params.fullName,
      }),
    })
    return {
      accountNumber: account.account_number,
      bankName: account.bank_name,
      accountName: params.fullName,
      raw: account,
    }
  }
}

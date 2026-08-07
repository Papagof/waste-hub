import { createHmac, timingSafeEqual } from "node:crypto"
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

const PAYSTACK_BASE_URL = "https://api.paystack.co"

function mapStatus(status: string): TransactionStatus {
  if (status === "success") return "success"
  if (status === "failed" || status === "abandoned" || status === "reversed") return "failed"
  return "pending"
}

export interface PaystackConfig {
  secretKey: string
}

export class PaystackGateway implements PaymentGatewayClient {
  readonly name = "paystack" as const

  constructor(private readonly config: PaystackConfig) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.config.secretKey}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    })
    const body = (await res.json()) as { status: boolean; message: string; data: T }
    if (!res.ok || !body.status) {
      throw new Error(`Paystack request failed: ${body.message ?? res.statusText}`)
    }
    return body.data
  }

  async initializeTransaction(
    params: InitializeTransactionParams,
  ): Promise<InitializeTransactionResult> {
    const data = await this.request<{ authorization_url: string }>("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify({
        reference: params.reference,
        amount: params.amountKobo,
        email: params.email,
        callback_url: params.callbackUrl,
        metadata: params.metadata,
        currency: "NGN",
      }),
    })
    return {
      reference: params.reference,
      authorizationUrl: data.authorization_url,
      raw: data,
    }
  }

  async verifyTransaction(reference: string): Promise<VerifyTransactionResult> {
    const data = await this.request<{
      status: string
      amount: number
      paid_at: string | null
      reference: string
    }>(`/transaction/verify/${encodeURIComponent(reference)}`)
    return {
      reference: data.reference,
      status: mapStatus(data.status),
      amountKobo: data.amount,
      paidAt: data.paid_at,
      raw: data,
    }
  }

  verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
    const expected = createHmac("sha512", this.config.secretKey).update(rawBody).digest("hex")
    const expectedBuf = Buffer.from(expected, "utf8")
    const actualBuf = Buffer.from(signatureHeader ?? "", "utf8")
    return expectedBuf.length === actualBuf.length && timingSafeEqual(expectedBuf, actualBuf)
  }

  parseWebhookEvent(rawBody: string): WebhookEvent {
    const payload = JSON.parse(rawBody) as {
      data: { reference: string; status: string; amount: number }
    }
    return {
      reference: payload.data.reference,
      status: mapStatus(payload.data.status),
      amountKobo: payload.data.amount,
      raw: payload,
    }
  }

  async createDedicatedVirtualAccount(
    params: CreateDedicatedVirtualAccountParams,
  ): Promise<DedicatedVirtualAccount> {
    const customer = await this.request<{ customer_code: string }>("/customer", {
      method: "POST",
      body: JSON.stringify({
        email: params.email,
        first_name: params.fullName.split(" ")[0],
        last_name: params.fullName.split(" ").slice(1).join(" ") || params.fullName,
        phone: params.phone,
      }),
    })
    const account = await this.request<{
      account_number: string
      bank: { name: string }
      account_name: string
    }>("/dedicated_account", {
      method: "POST",
      body: JSON.stringify({
        customer: customer.customer_code,
        preferred_bank: "wema-bank",
      }),
    })
    return {
      accountNumber: account.account_number,
      bankName: account.bank.name,
      accountName: account.account_name,
      raw: account,
    }
  }
}

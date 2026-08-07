import type { PaymentGateway as GatewayName } from "@waste-hub/shared-types"

/**
 * Server-only abstraction over Nigerian payment gateways. Implementations
 * hold secret API keys and must never run in a browser or React Native
 * bundle — only from apps/api or a Next.js server route/action.
 */
export interface InitializeTransactionParams {
  /** Unique reference we generate — becomes the payments.gateway_reference value. */
  reference: string
  amountKobo: number
  email: string
  /** Where the gateway redirects the payer after checkout (card/USSD/transfer flows). */
  callbackUrl?: string
  metadata?: Record<string, unknown>
}

export interface InitializeTransactionResult {
  reference: string
  /** URL to redirect the payer to for card/USSD/bank-transfer checkout. */
  authorizationUrl: string
  raw: unknown
}

export type TransactionStatus = "success" | "failed" | "pending"

export interface VerifyTransactionResult {
  reference: string
  status: TransactionStatus
  amountKobo: number
  paidAt: string | null
  raw: unknown
}

export interface WebhookEvent {
  reference: string
  status: TransactionStatus
  amountKobo: number
  raw: unknown
}

export interface DedicatedVirtualAccount {
  accountNumber: string
  bankName: string
  accountName: string
  raw: unknown
}

export interface CreateDedicatedVirtualAccountParams {
  residentId: string
  email: string
  fullName: string
  phone?: string
}

export interface PaymentGatewayClient {
  readonly name: GatewayName

  initializeTransaction(
    params: InitializeTransactionParams,
  ): Promise<InitializeTransactionResult>

  verifyTransaction(reference: string): Promise<VerifyTransactionResult>

  /** True if the raw webhook signature header matches the payload for this gateway's secret. */
  verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean

  parseWebhookEvent(rawBody: string): WebhookEvent

  /**
   * Dedicated/virtual account numbers for pay-by-transfer with automatic
   * reconciliation. Not every gateway account tier supports this — callers
   * should handle rejection and fall back to a shared account + reference.
   */
  createDedicatedVirtualAccount(
    params: CreateDedicatedVirtualAccountParams,
  ): Promise<DedicatedVirtualAccount>
}

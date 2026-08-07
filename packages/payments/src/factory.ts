import type { PaymentGateway as GatewayName } from "@waste-hub/shared-types"
import type { PaymentGatewayClient } from "./gateway.interface"
import { PaystackGateway } from "./gateways/paystack"
import { FlutterwaveGateway } from "./gateways/flutterwave"

export interface PaymentGatewayEnv {
  PAYSTACK_SECRET_KEY?: string
  FLUTTERWAVE_SECRET_KEY?: string
  FLUTTERWAVE_WEBHOOK_SECRET_HASH?: string
  /** Which online gateway new transactions use when the caller doesn't ask for a specific one. */
  DEFAULT_PAYMENT_GATEWAY?: Exclude<GatewayName, "manual">
}

/**
 * No merchant account was confirmed at project setup, so this stays
 * gateway-agnostic: callers pass which gateway they want (or rely on the
 * DEFAULT_PAYMENT_GATEWAY env var), and swapping the primary gateway later
 * is a config change, not a code change.
 */
export function createPaymentGateway(
  name: Exclude<GatewayName, "manual">,
  env: PaymentGatewayEnv,
): PaymentGatewayClient {
  switch (name) {
    case "paystack": {
      if (!env.PAYSTACK_SECRET_KEY) {
        throw new Error("PAYSTACK_SECRET_KEY is not configured")
      }
      return new PaystackGateway({ secretKey: env.PAYSTACK_SECRET_KEY })
    }
    case "flutterwave": {
      if (!env.FLUTTERWAVE_SECRET_KEY || !env.FLUTTERWAVE_WEBHOOK_SECRET_HASH) {
        throw new Error(
          "FLUTTERWAVE_SECRET_KEY and FLUTTERWAVE_WEBHOOK_SECRET_HASH are not configured",
        )
      }
      return new FlutterwaveGateway({
        secretKey: env.FLUTTERWAVE_SECRET_KEY,
        webhookSecretHash: env.FLUTTERWAVE_WEBHOOK_SECRET_HASH,
      })
    }
  }
}

export function createDefaultPaymentGateway(env: PaymentGatewayEnv): PaymentGatewayClient {
  return createPaymentGateway(env.DEFAULT_PAYMENT_GATEWAY ?? "paystack", env)
}

"use client";

import { useState } from "react";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Lock } from "lucide-react";
import { confirmCheckout, ApiError } from "@/lib/api-client";
import { formatPrice } from "@/lib/utils";

interface StripePaymentSectionProps {
  clientSecret: string;
  paymentIntentId: string;
  totalCents: number;
  stripeEnabled: boolean;
  onSuccess: (orderNumber: string) => void;
  onError: (message: string) => void;
}

export function StripePaymentSection({
  clientSecret,
  paymentIntentId,
  totalCents,
  stripeEnabled,
  onSuccess,
  onError,
}: StripePaymentSectionProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleStubConfirm = async () => {
    setLoading(true);
    try {
      const result = await confirmCheckout(paymentIntentId);
      onSuccess(result.order_number);
    } catch (err) {
      onError(
        err instanceof ApiError ? err.message : "Confirmation impossible.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStripePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout`,
        },
        redirect: "if_required",
      });

      if (error) {
        onError(error.message ?? "Paiement refusé.");
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        const result = await confirmCheckout(paymentIntentId);
        onSuccess(result.order_number);
      } else {
        onError("Paiement en attente de confirmation.");
      }
    } catch (err) {
      onError(
        err instanceof ApiError ? err.message : "Erreur lors du paiement.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!stripeEnabled) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Mode test — Stripe non configuré. Aucune carte réelle ne sera débitée.
        </p>
        <button
          type="button"
          disabled={loading}
          onClick={handleStubConfirm}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          <Lock className="h-4 w-4" />
          {loading ? "Traitement..." : `Confirmer ${formatPrice(totalCents)} (test)`}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleStripePay} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      <button
        type="submit"
        disabled={loading || !stripe || !elements}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
      >
        <Lock className="h-4 w-4" />
        {loading ? "Traitement..." : `Payer ${formatPrice(totalCents)}`}
      </button>
    </form>
  );
}

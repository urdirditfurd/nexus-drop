"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { CheckCircle } from "lucide-react";
import { useCartStore } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";
import { createCheckoutIntent, ApiError } from "@/lib/api-client";
import { StripePaymentSection } from "@/components/StripePaymentSection";

type Step = "form" | "payment" | "success";

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCartStore();
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [stripePromise, setStripePromise] =
    useState<Promise<Stripe | null> | null>(null);
  const [stripeEnabled, setStripeEnabled] = useState(false);

  const shipping = subtotal() >= 5000 ? 0 : 499;
  const total = subtotal() + shipping;

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const firstName = String(form.get("firstName") ?? "");
    const lastName = String(form.get("lastName") ?? "");
    const address = String(form.get("address") ?? "");
    const postalCode = String(form.get("postalCode") ?? "");
    const city = String(form.get("city") ?? "");
    const phone = String(form.get("phone") ?? "");

    try {
      const intent = await createCheckoutIntent({
        items: items.map(({ product, quantity }) => ({
          product_id: parseInt(product.id, 10),
          quantity,
        })),
        customer_email: email,
        currency: "EUR",
        shipping_address: {
          firstName,
          lastName,
          address,
          postalCode,
          city,
          phone,
        },
      });

      setClientSecret(intent.client_secret);
      setPaymentIntentId(intent.payment_intent_id);
      setStripeEnabled(intent.stripe_enabled ?? false);

      if (intent.stripe_enabled && intent.publishable_key) {
        setStripePromise(loadStripe(intent.publishable_key));
      }

      setStep("payment");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Impossible de préparer le paiement.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (confirmedOrderNumber: string) => {
    setOrderNumber(confirmedOrderNumber);
    setStep("success");
    clearCart();
  };

  if (items.length === 0 && step === "form") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Panier vide</h1>
        <p className="mt-2 text-zinc-500">
          Ajoutez des produits avant de passer commande.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white"
        >
          Retour à la boutique
        </Link>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-accent" />
        <h1 className="mt-6 text-2xl font-bold">Commande confirmée !</h1>
        <p className="mt-2 text-zinc-500">
          Merci pour votre achat. Vous recevrez un email de confirmation.
        </p>
        {orderNumber && (
          <p className="mt-2 font-mono text-sm text-zinc-600 dark:text-zinc-400">
            N° {orderNumber}
          </p>
        )}
        <Link
          href={orderNumber ? `/orders/${orderNumber}` : "/"}
          className="mt-6 inline-block rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white"
        >
          Suivre ma commande
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="mb-8 text-2xl font-bold sm:text-3xl">Checkout</h1>

      {error && (
        <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="grid gap-10 lg:grid-cols-5">
        <div className="space-y-8 lg:col-span-3">
          {step === "form" && (
            <form onSubmit={handleFormSubmit} className="space-y-8">
              <section className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
                <h2 className="mb-4 text-lg font-semibold">Contact</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    required
                    name="email"
                    type="email"
                    placeholder="Email"
                    className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-accent dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <input
                    name="phone"
                    type="tel"
                    placeholder="Téléphone"
                    className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-accent dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
              </section>

              <section className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
                <h2 className="mb-4 text-lg font-semibold">Adresse de livraison</h2>
                <div className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      required
                      name="firstName"
                      placeholder="Prénom"
                      className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-accent dark:border-zinc-700 dark:bg-zinc-900"
                    />
                    <input
                      required
                      name="lastName"
                      placeholder="Nom"
                      className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-accent dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  </div>
                  <input
                    required
                    name="address"
                    placeholder="Adresse"
                    className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-accent dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <input
                      required
                      name="postalCode"
                      placeholder="Code postal"
                      className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-accent dark:border-zinc-700 dark:bg-zinc-900"
                    />
                    <input
                      required
                      name="city"
                      placeholder="Ville"
                      className="col-span-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-accent dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  </div>
                </div>
              </section>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-accent py-3 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {loading ? "Préparation..." : "Continuer vers le paiement"}
              </button>
            </form>
          )}

          {step === "payment" && clientSecret && paymentIntentId && (
            <section className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
              <h2 className="mb-4 text-lg font-semibold">Paiement sécurisé</h2>
              {stripeEnabled && stripePromise ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripePaymentSection
                    clientSecret={clientSecret}
                    paymentIntentId={paymentIntentId}
                    totalCents={total}
                    stripeEnabled={stripeEnabled}
                    onSuccess={handlePaymentSuccess}
                    onError={setError}
                  />
                </Elements>
              ) : (
                <StripePaymentSection
                  clientSecret={clientSecret}
                  paymentIntentId={paymentIntentId}
                  totalCents={total}
                  stripeEnabled={false}
                  onSuccess={handlePaymentSuccess}
                  onError={setError}
                />
              )}
            </section>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
            <h2 className="mb-4 text-lg font-semibold">Votre commande</h2>
            <div className="max-h-60 space-y-3 overflow-y-auto">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-600 text-xs text-white">
                      {quantity}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-1">
                      {product.name}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {formatPrice(product.price * quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-700">
              <div className="flex justify-between">
                <span className="text-zinc-500">Sous-total</span>
                <span>{formatPrice(subtotal())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Livraison</span>
                <span>
                  {shipping === 0 ? "Gratuite" : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CreditCard, Lock, CheckCircle } from "lucide-react";
import { useCartStore } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";
import {
  createCheckoutIntent,
  confirmCheckout,
  ApiError,
} from "@/lib/api-client";

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCartStore();
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const shipping = subtotal() >= 5000 ? 0 : 499;
  const total = subtotal() + shipping;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

      await confirmCheckout(intent.payment_intent_id);

      setOrderNumber(intent.order_number);
      setStep("success");
      clearCart();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Paiement impossible. Vérifiez que l'API tourne sur :8000.",
      );
    } finally {
      setLoading(false);
    }
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

      <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-5">
        <div className="space-y-8 lg:col-span-3">
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

          <section className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <CreditCard className="h-5 w-5" />
              Paiement (mode test)
            </h2>
            <p className="mb-4 text-sm text-zinc-500">
              Paiement simulé — aucune carte réelle n&apos;est débitée en développement.
            </p>
            <div className="grid gap-4">
              <input
                required
                placeholder="Numéro de carte (4242 4242 4242 4242)"
                defaultValue="4242 4242 4242 4242"
                className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-accent dark:border-zinc-700 dark:bg-zinc-900"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  required
                  placeholder="MM/AA"
                  defaultValue="12/28"
                  className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-accent dark:border-zinc-700 dark:bg-zinc-900"
                />
                <input
                  required
                  placeholder="CVC"
                  defaultValue="123"
                  className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-accent dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
            </div>
          </section>
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
            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              <Lock className="h-4 w-4" />
              {loading ? "Traitement..." : `Payer ${formatPrice(total)}`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

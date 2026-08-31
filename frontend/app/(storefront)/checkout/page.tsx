"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CreditCard, Lock, CheckCircle } from "lucide-react";
import { useCartStore } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCartStore();
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);

  const shipping = subtotal() >= 5000 ? 0 : 499;
  const total = subtotal() + shipping;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("success");
      clearCart();
    }, 1500);
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
        <Link
          href="/orders/ORD-2024-001234"
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

      <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-5">
        <div className="space-y-8 lg:col-span-3">
          <section className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
            <h2 className="mb-4 text-lg font-semibold">Contact</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                required
                type="email"
                placeholder="Email"
                className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-accent dark:border-zinc-700 dark:bg-zinc-900"
              />
              <input
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
                  placeholder="Prénom"
                  className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-accent dark:border-zinc-700 dark:bg-zinc-900"
                />
                <input
                  required
                  placeholder="Nom"
                  className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-accent dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <input
                required
                placeholder="Adresse"
                className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-accent dark:border-zinc-700 dark:bg-zinc-900"
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <input
                  required
                  placeholder="Code postal"
                  className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-accent dark:border-zinc-700 dark:bg-zinc-900"
                />
                <input
                  required
                  placeholder="Ville"
                  className="col-span-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-accent dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <CreditCard className="h-5 w-5" />
              Paiement
            </h2>
            <div className="grid gap-4">
              <input
                required
                placeholder="Numéro de carte"
                className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-accent dark:border-zinc-700 dark:bg-zinc-900"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  required
                  placeholder="MM/AA"
                  className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-accent dark:border-zinc-700 dark:bg-zinc-900"
                />
                <input
                  required
                  placeholder="CVC"
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

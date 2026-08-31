"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";
import { TrustBadges } from "@/components/TrustBadges";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, totalItems } =
    useCartStore();

  const shipping = subtotal() >= 5000 ? 0 : 499;
  const total = subtotal() + shipping;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Votre panier est vide"
          description="Découvrez nos produits et ajoutez-les à votre panier."
          action={
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-hover"
            >
              <ShoppingBag className="h-4 w-4" />
              Continuer mes achats
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="mb-8 text-2xl font-bold sm:text-3xl">
        Panier ({totalItems()})
      </h1>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map(({ product, quantity }) => (
            <div
              key={product.id}
              className="flex gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link
                    href={`/products/${product.slug}`}
                    className="font-medium hover:text-accent"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1 text-sm font-semibold">
                    {formatPrice(product.price)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <button
                      onClick={() =>
                        updateQuantity(product.id, quantity - 1)
                      }
                      className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      aria-label="Diminuer"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-sm">{quantity}</span>
                    <button
                      onClick={() =>
                        updateQuantity(product.id, quantity + 1)
                      }
                      className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      aria-label="Augmenter"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(product.id)}
                    className="p-2 text-zinc-400 hover:text-red-500"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
            <h2 className="mb-4 text-lg font-semibold">Récapitulatif</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Sous-total</span>
                <span>{formatPrice(subtotal())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Livraison</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-accent">Gratuite</span>
                  ) : (
                    formatPrice(shipping)
                  )}
                </span>
              </div>
              {subtotal() < 5000 && (
                <p className="text-xs text-zinc-400">
                  Livraison gratuite dès {formatPrice(5000)}
                </p>
              )}
              <div className="border-t border-zinc-200 pt-2 dark:border-zinc-700">
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
            <Link
              href="/checkout"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Passer commande
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4">
            <TrustBadges compact />
          </div>
        </div>
      </div>
    </div>
  );
}

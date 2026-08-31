"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/demo-data";
import { DEMO_REVIEWS } from "@/lib/demo-data";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "@/components/AddToCartButton";
import { TrustBadges } from "@/components/TrustBadges";

interface ProductPageClientProps {
  product: Product;
  fallback: boolean;
}

export function ProductPageClient({ product, fallback }: ProductPageClientProps) {
  const images = product.images ?? [product.image];
  const [selectedImage, setSelectedImage] = useState(0);

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) *
            100,
        )
      : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      {fallback && (
        <p className="mb-4 text-xs text-amber-600 dark:text-amber-400">
          Mode démo — API indisponible
        </p>
      )}

      <nav className="mb-6 flex items-center gap-1 text-sm text-zinc-500">
        <Link href="/" className="hover:text-accent">
          Accueil
        </Link>
        <ChevronRight className="h-4 w-4" />
        {product.collectionSlug && (
          <>
            <Link
              href={`/collections/${product.collectionSlug}`}
              className="hover:text-accent"
            >
              {product.collection}
            </Link>
            <ChevronRight className="h-4 w-4" />
          </>
        )}
        <span className="text-zinc-900 dark:text-zinc-100">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
            <Image
              src={images[selectedImage]}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
            {discount && (
              <span className="absolute left-4 top-4 rounded-lg bg-accent px-3 py-1 text-sm font-medium text-white">
                -{discount}%
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${
                    selectedImage === i
                      ? "border-accent"
                      : "border-transparent"
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info + Sticky cart */}
        <div>
          <div className="lg:sticky lg:top-24">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {product.name}
            </h1>

            {product.rating && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.rating!)
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-zinc-500">
                  {product.rating} ({product.reviewCount} avis)
                </span>
              </div>
            )}

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-bold">
                {formatPrice(product.price)}
              </span>
              {product.compareAtPrice && (
                <span className="text-lg text-zinc-400 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>

            <p className="mt-6 text-zinc-600 dark:text-zinc-400">
              {product.description}
            </p>

            <div className="mt-8">
              <AddToCartButton product={product} showQuantity />
            </div>

            <div className="mt-6">
              <TrustBadges compact />
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-16 border-t border-zinc-200 pt-16 dark:border-zinc-800">
        <h2 className="mb-8 text-2xl font-bold">
          Avis clients ({product.reviewCount ?? DEMO_REVIEWS.length})
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_REVIEWS.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800"
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < review.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">{review.author}</span>
              </div>
              <p className="text-sm text-zinc-500">{review.date}</p>
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                {review.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "@/components/AddToCartButton";
import { TrustBadges } from "@/components/TrustBadges";

interface ProductPageClientProps {
  product: Product;
}

export function ProductPageClient({ product }: ProductPageClientProps) {
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
                  {product.rating} ({product.reviewCount ?? 0} avis)
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
    </div>
  );
}

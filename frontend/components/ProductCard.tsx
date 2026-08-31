import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import type { Product } from "@/lib/demo-data";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const discount =
    product.compareAtPrice &&
    product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) *
            100,
        )
      : null;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-card transition hover:shadow-elevated dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {discount && (
          <span className="absolute left-2 top-2 rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-white">
            -{discount}%
          </span>
        )}
        {product.tags?.includes("trending") && (
          <span className="absolute right-2 top-2 rounded-md bg-orange-500 px-2 py-0.5 text-xs font-medium text-white">
            Trending
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {product.name}
        </h3>
        {product.rating && (
          <div className="mt-1 flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs text-zinc-500">
              {product.rating} ({product.reviewCount})
            </span>
          </div>
        )}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-semibold text-zinc-900 dark:text-white">
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice && (
            <span className="text-sm text-zinc-400 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

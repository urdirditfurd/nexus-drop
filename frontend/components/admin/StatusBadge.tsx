"use client";

import { AlertTriangle } from "lucide-react";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop";

export function resolveProductImage(url: string | undefined | null): string {
  if (!url) return PLACEHOLDER_IMAGE;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

type ProductStatus = "published" | "active" | "draft" | "quarantine" | string;

interface StatusBadgeProps {
  status: ProductStatus;
  quarantineReason?: string | null;
}

export function StatusBadge({ status, quarantineReason }: StatusBadgeProps) {
  const normalized = status === "active" ? "published" : status;

  if (normalized === "published") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300">
        Publié
      </span>
    );
  }

  if (normalized === "quarantine") {
    return (
      <span
        className="group relative inline-flex cursor-help items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800 dark:bg-red-900/40 dark:text-red-300"
        title={quarantineReason ?? "Produit en quarantaine"}
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        Quarantaine
        {quarantineReason && (
          <span className="pointer-events-none absolute bottom-full right-0 z-20 mb-2 hidden w-64 rounded-lg border border-zinc-200 bg-white p-2 text-xs font-normal text-zinc-700 shadow-lg group-hover:block dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {quarantineReason}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
      Draft
    </span>
  );
}

export function formatEuro(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
}

export function cnPrices(supplierTotal: number, competitorMin: number | null) {
  const fourn = formatEuro(supplierTotal);
  const conc = competitorMin != null ? formatEuro(competitorMin) : "—";
  return `Fourn: ${fourn} | Conc: ${conc}`;
}

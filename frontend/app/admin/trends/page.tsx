"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { RefreshCw, TrendingUp, Package } from "lucide-react";
import {
  listAdminProducts,
  listAdminTrends,
  type AdminProduct,
  type AdminTrend,
} from "@/lib/api-client";
import {
  StatusBadge,
  resolveProductImage,
  formatEuro,
} from "@/components/admin/StatusBadge";

function competitorForProduct(product: AdminProduct, trends: AdminTrend[]): number | null {
  const key = (product.keyword ?? product.title ?? "").toLowerCase();
  if (!key) return null;
  const match = trends.find((t) => key.includes(t.keyword.toLowerCase()) || t.keyword.toLowerCase().includes(key));
  if (match?.avg_price != null) return match.avg_price;
  if (product.sell_price > 0 && product.margin_calculated != null && product.margin_calculated > 0) {
    return Math.round(product.sell_price / 0.98 * 100) / 100;
  }
  return null;
}

function subtitle(product: AdminProduct): string {
  const parts: string[] = [];
  if (product.keyword) parts.push(product.keyword);
  if (product.ean) parts.push(`EAN ${product.ean}`);
  if (product.asin) parts.push(`ASIN ${product.asin}`);
  return parts.join(" · ") || product.sku;
}

export default function AdminTrendsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [trends, setTrends] = useState<AdminTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prods, tr] = await Promise.all([listAdminProducts(), listAdminTrends()]);
      setProducts(prods);
      setTrends(tr.sort((a, b) => b.score - a.score));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pipelineItems = useMemo(() => {
    const sorted = [...products].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );
    const productKeywords = new Set(
      sorted.map((p) => (p.keyword ?? "").toLowerCase()).filter(Boolean),
    );
    const trendOnly = trends
      .filter((t) => !productKeywords.has(t.keyword.toLowerCase()))
      .slice(0, 10)
      .map((t) => ({
        id: `trend-${t.id}`,
        title: t.keyword,
        subtitle: `${t.platform ?? "multi"} · Score ${t.score.toFixed(0)}/100`,
        supplierTotal: null as number | null,
        competitorMin: t.avg_price,
        status: "draft" as const,
        quarantineReason: null as string | null,
        image: null as string | null,
      }));

    const fromProducts = sorted.map((p) => ({
      id: `product-${p.id}`,
      title: p.title,
      subtitle: subtitle(p),
      supplierTotal: Number(p.cost_price) + Number(p.shipping_cost ?? 0),
      competitorMin: competitorForProduct(p, trends),
      status: p.status,
      quarantineReason: p.quarantine_reason ?? null,
      image: p.image_urls?.[0] ?? null,
    }));

    return [...fromProducts, ...trendOnly];
  }, [products, trends]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <TrendingUp className="h-6 w-6 text-accent" />
            Pipeline & Tendances
          </h1>
          <p className="text-sm text-zinc-500">
            {products.length} produit{products.length > 1 ? "s" : ""} · {trends.length} tendance
            {trends.length > 1 ? "s" : ""} scannée{trends.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <RefreshCw className="h-4 w-4" /> Actualiser
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Chargement du pipeline...</p>
      ) : pipelineItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 py-16 dark:border-zinc-700">
          <Package className="mb-3 h-10 w-10 text-zinc-400" />
          <p className="text-sm text-zinc-500">Aucun produit ni tendance pour le moment.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="hidden border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 sm:grid sm:grid-cols-[auto_1fr_auto_auto] sm:gap-4">
            <span className="pl-14">Produit</span>
            <span />
            <span>Prix marché</span>
            <span className="text-right">Statut</span>
          </div>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {pipelineItems.map((item, index) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                className="flex flex-col gap-3 px-4 py-3 sm:grid sm:grid-cols-[auto_1fr_auto_auto] sm:items-center sm:gap-4"
              >
                <div className="flex min-w-0 items-center gap-3 sm:col-span-2">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                    <Image
                      src={resolveProductImage(item.image)}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.title}
                    </p>
                    <p className="truncate text-xs text-zinc-500">{item.subtitle}</p>
                  </div>
                </div>

                <div className="pl-14 text-sm tabular-nums text-zinc-700 dark:text-zinc-300 sm:pl-0">
                  {item.supplierTotal != null ? (
                    <>
                      <span className="text-zinc-500">Fourn:</span>{" "}
                      <span className="font-medium">{formatEuro(item.supplierTotal)}</span>
                      <span className="mx-1.5 text-zinc-300">|</span>
                      <span className="text-zinc-500">Conc:</span>{" "}
                      <span className="font-medium">{formatEuro(item.competitorMin)}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-zinc-500">Conc. estimé:</span>{" "}
                      <span className="font-medium">{formatEuro(item.competitorMin)}</span>
                    </>
                  )}
                </div>

                <div className="flex justify-end pl-14 sm:pl-0">
                  <StatusBadge status={item.status} quarantineReason={item.quarantineReason} />
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

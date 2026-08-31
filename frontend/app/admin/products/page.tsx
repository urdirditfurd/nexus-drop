"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Search, MoreHorizontal, Edit, Trash2, RefreshCw } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { listAdminProducts, type AdminProduct } from "@/lib/api-client";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setProducts(await listAdminProducts());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Produits</h1>
          <p className="text-sm text-zinc-500">
            {products.length} produit{products.length > 1 ? "s" : ""} · API live
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover">
          <Plus className="h-4 w-4" />
          Ajouter un produit
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <span>{error}</span>
          <button onClick={load} className="flex items-center gap-1 underline">
            <RefreshCw className="h-3.5 w-3.5" /> Réessayer
          </button>
        </div>
      )}

      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrer les produits..."
            className="w-full rounded-lg border border-zinc-200 py-2 pl-10 pr-4 text-sm outline-none focus:border-accent dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Chargement des produits...</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">
                  Produit
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-zinc-500 sm:table-cell">
                  Catégorie
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">
                  Prix
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-zinc-500 md:table-cell">
                  Stock
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-zinc-500 lg:table-cell">
                  Statut
                </th>
                <th className="px-4 py-3 text-right font-medium text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filtered.map((product) => {
                const image =
                  product.image_urls?.[0] ??
                  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800";
                const priceCents = Math.round(Number(product.sell_price) * 100);
                return (
                  <tr
                    key={product.id}
                    className="bg-white dark:bg-zinc-950"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                          <Image
                            src={image}
                            alt={product.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="font-medium line-clamp-1">
                          {product.title}
                        </span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-zinc-500 sm:table-cell">
                      {product.category ?? "—"}
                    </td>
                    <td className="px-4 py-3">{formatPrice(priceCents)}</td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          product.stock > 0
                            ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {product.stock > 0 ? `${product.stock} en stock` : "Rupture"}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 capitalize lg:table-cell">
                      {product.status}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button className="rounded p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                          <Edit className="h-4 w-4 text-zinc-500" />
                        </button>
                        <button className="rounded p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                          <Trash2 className="h-4 w-4 text-zinc-500" />
                        </button>
                        <button className="rounded p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                          <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

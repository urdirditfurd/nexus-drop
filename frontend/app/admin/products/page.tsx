"use client";

import Image from "next/image";
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { DEMO_PRODUCTS } from "@/lib/demo-data";
import { formatPrice } from "@/lib/utils";

export default function AdminProductsPage() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Produits</h1>
          <p className="text-sm text-zinc-500">
            {DEMO_PRODUCTS.length} produits · Mode démo
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover">
          <Plus className="h-4 w-4" />
          Ajouter un produit
        </button>
      </div>

      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            placeholder="Filtrer les produits..."
            className="w-full rounded-lg border border-zinc-200 py-2 pl-10 pr-4 text-sm outline-none focus:border-accent dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">
                Produit
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-zinc-500 sm:table-cell">
                Collection
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">
                Prix
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-zinc-500 md:table-cell">
                Stock
              </th>
              <th className="px-4 py-3 text-right font-medium text-zinc-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {DEMO_PRODUCTS.map((product) => (
              <tr
                key={product.id}
                className="bg-white dark:bg-zinc-950"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="font-medium">{product.name}</span>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-zinc-500 sm:table-cell">
                  {product.collection}
                </td>
                <td className="px-4 py-3">{formatPrice(product.price)}</td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    En stock
                  </span>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

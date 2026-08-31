"use client";

import { Truck, Star, ExternalLink, Mail } from "lucide-react";

const suppliers = [
  {
    id: "s1",
    name: "AliExpress Premium",
    category: "Tech & Gadgets",
    rating: 4.7,
    products: 156,
    avgDelivery: "12-18 jours",
    status: "active" as const,
  },
  {
    id: "s2",
    name: "CJ Dropshipping",
    category: "Multi-catégories",
    rating: 4.5,
    products: 342,
    avgDelivery: "8-14 jours",
    status: "active" as const,
  },
  {
    id: "s3",
    name: "Spocket EU",
    category: "Maison & Mode",
    rating: 4.8,
    products: 89,
    avgDelivery: "3-7 jours",
    status: "active" as const,
  },
  {
    id: "s4",
    name: "Zendrop",
    category: "Fitness & Sport",
    rating: 4.3,
    products: 67,
    avgDelivery: "10-15 jours",
    status: "pending" as const,
  },
];

export default function AdminSuppliersPage() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Fournisseurs</h1>
          <p className="text-sm text-zinc-500">
            {suppliers.length} fournisseurs connectés
          </p>
        </div>
        <button className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover">
          Ajouter un fournisseur
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {suppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-light dark:bg-accent/20">
                  <Truck className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold">{supplier.name}</h3>
                  <p className="text-xs text-zinc-500">{supplier.category}</p>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  supplier.status === "active"
                    ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                }`}
              >
                {supplier.status === "active" ? "Actif" : "En attente"}
              </span>
            </div>
            <div className="mb-4 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold">{supplier.products}</p>
                <p className="text-xs text-zinc-500">Produits</p>
              </div>
              <div>
                <p className="flex items-center justify-center gap-1 text-lg font-bold">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {supplier.rating}
                </p>
                <p className="text-xs text-zinc-500">Note</p>
              </div>
              <div>
                <p className="text-sm font-bold">{supplier.avgDelivery}</p>
                <p className="text-xs text-zinc-500">Livraison</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 py-2 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                <ExternalLink className="h-3.5 w-3.5" />
                Voir catalogue
              </button>
              <button className="flex items-center justify-center rounded-lg border border-zinc-200 p-2 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                <Mail className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Truck, Star, ExternalLink, Mail, RefreshCw } from "lucide-react";
import { listAdminSuppliers, type AdminSupplier } from "@/lib/api-client";

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<AdminSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setSuppliers(await listAdminSuppliers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Fournisseurs</h1>
          <p className="text-sm text-zinc-500">
            {suppliers.length} fournisseur{suppliers.length > 1 ? "s" : ""} · API live
          </p>
        </div>
        <button className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover">
          Ajouter un fournisseur
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Chargement...</p>
      ) : (
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
                    <p className="text-xs text-zinc-500 capitalize">
                      {supplier.platform ?? "Plateforme non définie"}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    supplier.is_active
                      ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}
                >
                  {supplier.is_active ? "Actif" : "Inactif"}
                </span>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="flex items-center justify-center gap-1 text-lg font-bold">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {supplier.rating?.toFixed(1) ?? "—"}
                  </p>
                  <p className="text-xs text-zinc-500">Note</p>
                </div>
                <div>
                  <p className="text-sm font-bold truncate">
                    {supplier.contact_email ?? "—"}
                  </p>
                  <p className="text-xs text-zinc-500">Contact</p>
                </div>
              </div>
              {supplier.notes && (
                <p className="mb-4 text-xs text-zinc-500 line-clamp-2">{supplier.notes}</p>
              )}
              <div className="flex gap-2">
                <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 py-2 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Voir catalogue
                </button>
                {supplier.contact_email && (
                  <a
                    href={`mailto:${supplier.contact_email}`}
                    className="flex items-center justify-center rounded-lg border border-zinc-200 p-2 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && suppliers.length === 0 && !error && (
        <button onClick={load} className="mt-2 flex items-center gap-1 text-sm text-accent">
          <RefreshCw className="h-4 w-4" /> Actualiser
        </button>
      )}
    </div>
  );
}

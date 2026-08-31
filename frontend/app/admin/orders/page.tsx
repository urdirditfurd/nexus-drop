"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { listAdminOrders, type AdminOrder } from "@/lib/api-client";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  paid: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  fulfilled: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const statusLabels: Record<string, string> = {
  pending: "En attente",
  paid: "Payée",
  fulfilled: "Préparée",
  processing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await listAdminOrders());
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Commandes</h1>
          <p className="text-sm text-zinc-500">
            {orders.length} commande{orders.length > 1 ? "s" : ""} · API live
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
        <p className="text-sm text-zinc-500">Chargement des commandes...</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Aucune commande pour le moment. Passez une commande test depuis la boutique.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Commande</th>
                <th className="hidden px-4 py-3 text-left font-medium text-zinc-500 sm:table-cell">Client</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Date</th>
                <th className="hidden px-4 py-3 text-left font-medium text-zinc-500 md:table-cell">Articles</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Total</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {orders.map((order) => (
                <tr key={order.id} className="bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900">
                  <td className="px-4 py-3">
                    <Link href={`/orders/${order.order_number}`} className="font-medium text-accent hover:underline">
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-500 sm:table-cell">
                    {order.customer_email ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(order.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    {order.items.length}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatPrice(Math.round(Number(order.total_amount) * 100))}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[order.status] ?? statusStyles.pending}`}>
                      {statusLabels[order.status] ?? order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

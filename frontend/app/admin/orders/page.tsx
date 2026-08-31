"use client";

import Link from "next/link";
import { DEMO_ORDER } from "@/lib/demo-data";
import { formatPrice } from "@/lib/utils";

const demoOrders = [
  { ...DEMO_ORDER },
  {
    id: "ORD-2024-001233",
    status: "delivered" as const,
    createdAt: "2024-08-25T14:00:00Z",
    total: 8999,
    customer: "Marie L.",
    items: 1,
  },
  {
    id: "ORD-2024-001232",
    status: "processing" as const,
    createdAt: "2024-08-24T09:15:00Z",
    total: 3499,
    customer: "Thomas D.",
    items: 1,
  },
  {
    id: "ORD-2024-001231",
    status: "pending" as const,
    createdAt: "2024-08-23T16:45:00Z",
    total: 12497,
    customer: "Sophie M.",
    items: 3,
  },
];

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  processing: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const statusLabels: Record<string, string> = {
  pending: "En attente",
  processing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export default function AdminOrdersPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Commandes</h1>
        <p className="text-sm text-zinc-500">{demoOrders.length} commandes récentes</p>
      </div>

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
            {demoOrders.map((order) => (
              <tr key={order.id} className="bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900">
                <td className="px-4 py-3">
                  <Link href={`/orders/${order.id}`} className="font-medium text-accent hover:underline">
                    {order.id}
                  </Link>
                </td>
                <td className="hidden px-4 py-3 text-zinc-500 sm:table-cell">
                  {"customer" in order ? order.customer : "Jean D."}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  {"items" in order && typeof order.items === "number"
                    ? order.items
                    : Array.isArray(order.items)
                      ? order.items.length
                      : 0}
                </td>
                <td className="px-4 py-3 font-medium">{formatPrice(order.total)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

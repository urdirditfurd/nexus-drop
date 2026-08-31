"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Percent,
  TrendingUp,
  ListChecks,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  getDashboardKpis,
  getDashboardChart,
  type DashboardKPIs,
  type ChartPoint,
} from "@/lib/api-client";

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [kpiData, chart] = await Promise.all([
          getDashboardKpis(),
          getDashboardChart(),
        ]);
        setKpis(kpiData);
        setChartData(chart);
      } catch (err) {
        setError(err instanceof Error ? err.message : "API indisponible");
      }
    }
    load();
  }, []);

  const cards = kpis
    ? [
        {
          label: "Revenus du mois",
          value: `${Number(kpis.revenue_month).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`,
          icon: DollarSign,
        },
        {
          label: "Commandes en attente",
          value: kpis.pending_orders.toString(),
          icon: ShoppingCart,
        },
        {
          label: "Produits catalogue",
          value: kpis.total_products.toString(),
          icon: Package,
        },
        {
          label: "Marge moyenne",
          value: `${kpis.avg_margin_pct}%`,
          icon: Percent,
        },
        {
          label: "Listings actifs",
          value: kpis.active_listings.toString(),
          icon: ListChecks,
        },
        {
          label: "Top tendance",
          value: kpis.top_trend_keyword ?? "—",
          icon: TrendingUp,
        },
      ]
    : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-zinc-500">
          Vue d&apos;ensemble de votre boutique · API live
        </p>
        {error && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">{card.label}</span>
              <card.icon className="h-5 w-5 text-accent" />
            </div>
            <p className="mt-2 text-xl font-bold line-clamp-2">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 font-semibold">Revenus hebdomadaires (€)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#008060"
                fill="#008060"
                fillOpacity={0.15}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 font-semibold">Commandes par jour</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="orders" fill="#008060" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

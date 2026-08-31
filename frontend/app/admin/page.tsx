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
import { DollarSign, ShoppingCart, Users, TrendingUp, Package, Percent } from "lucide-react";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";

interface Kpis {
  revenue: number;
  orders: number;
  visitors: number;
  conversionRate: number;
  avgOrderValue: number;
  productsSold: number;
}

interface ChartPoint {
  name: string;
  revenue: number;
  orders: number;
}

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
        const [kpiRes, chartRes] = await Promise.all([
          fetch(`${apiUrl}/api/admin/kpis`),
          fetch(`${apiUrl}/api/admin/chart`),
        ]);
        if (!kpiRes.ok || !chartRes.ok) throw new Error("API down");
        setKpis(await kpiRes.json());
        setChartData(await chartRes.json());
      } catch {
        setFallback(true);
        setKpis({
          revenue: 45890,
          orders: 127,
          visitors: 3420,
          conversionRate: 3.7,
          avgOrderValue: 3610,
          productsSold: 389,
        });
        setChartData([
          { name: "Lun", revenue: 4200, orders: 12 },
          { name: "Mar", revenue: 5800, orders: 18 },
          { name: "Mer", revenue: 3900, orders: 10 },
          { name: "Jeu", revenue: 7100, orders: 22 },
          { name: "Ven", revenue: 8900, orders: 28 },
          { name: "Sam", revenue: 6200, orders: 19 },
          { name: "Dim", revenue: 4800, orders: 14 },
        ]);
      }
    }
    load();
  }, []);

  const cards = kpis
    ? [
        {
          label: "Revenus",
          value: formatPrice(kpis.revenue),
          icon: DollarSign,
          change: "+12.5%",
        },
        {
          label: "Commandes",
          value: kpis.orders.toString(),
          icon: ShoppingCart,
          change: "+8.2%",
        },
        {
          label: "Visiteurs",
          value: kpis.visitors.toLocaleString("fr-FR"),
          icon: Users,
          change: "+15.3%",
        },
        {
          label: "Conversion",
          value: `${kpis.conversionRate}%`,
          icon: Percent,
          change: "+0.4%",
        },
        {
          label: "Panier moyen",
          value: formatPrice(kpis.avgOrderValue),
          icon: TrendingUp,
          change: "+5.1%",
        },
        {
          label: "Produits vendus",
          value: kpis.productsSold.toString(),
          icon: Package,
          change: "+18.7%",
        },
      ]
    : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-zinc-500">
          Vue d&apos;ensemble de votre boutique
        </p>
        {fallback && (
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
            Données de démonstration — API indisponible
          </p>
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
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
            <p className="mt-1 text-xs text-green-600">{card.change} vs sem. dernière</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 font-semibold">Revenus hebdomadaires</h2>
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

"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, Flame, ArrowUpRight } from "lucide-react";

const radarData = [
  { category: "Tech", score: 92, market: 78 },
  { category: "Maison", score: 75, market: 65 },
  { category: "Fitness", score: 88, market: 82 },
  { category: "Mode", score: 60, market: 70 },
  { category: "Accessoires", score: 85, market: 72 },
  { category: "Beauté", score: 70, market: 68 },
];

const trendingItems = [
  { name: "Écouteurs Sans Fil Pro", growth: "+245%", score: 95 },
  { name: "Chargeur Solaire Portable", growth: "+189%", score: 88 },
  { name: "Montre Connectée Elite", growth: "+156%", score: 82 },
  { name: "Tapis Yoga Premium", growth: "+134%", score: 79 },
  { name: "Bouteille Isotherme", growth: "+98%", score: 74 },
];

export default function AdminTrendsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Radar Tendances</h1>
        <p className="text-sm text-zinc-500">
          Analyse des tendances marché vs performance boutique
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <TrendingUp className="h-5 w-5 text-accent" />
            Radar par catégorie
          </h2>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e4e4e7" />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar
                name="Votre boutique"
                dataKey="score"
                stroke="#008060"
                fill="#008060"
                fillOpacity={0.2}
              />
              <Radar
                name="Marché"
                dataKey="market"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.1}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <Flame className="h-5 w-5 text-orange-500" />
            Top tendances
          </h2>
          <div className="space-y-3">
            {trendingItems.map((item, i) => (
              <div
                key={item.name}
                className="flex items-center gap-4 rounded-lg border border-zinc-100 p-3 dark:border-zinc-800"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-light text-sm font-bold text-accent dark:bg-accent/20">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-zinc-500">
                    Score tendance : {item.score}/100
                  </p>
                </div>
                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                  <ArrowUpRight className="h-4 w-4" />
                  {item.growth}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, Flame, ArrowUpRight, RefreshCw } from "lucide-react";
import { listAdminTrends, type AdminTrend } from "@/lib/api-client";

function buildRadarData(trends: AdminTrend[]) {
  const byNiche: Record<string, { score: number; count: number }> = {};
  for (const t of trends) {
    const niche = t.niche ?? "Autre";
    if (!byNiche[niche]) byNiche[niche] = { score: 0, count: 0 };
    byNiche[niche].score += t.score;
    byNiche[niche].count += 1;
  }
  return Object.entries(byNiche).map(([category, { score, count }]) => ({
    category: category.replace(/-/g, " "),
    score: Math.round(score / count),
    market: Math.round(score / count * 0.85),
  }));
}

export default function AdminTrendsPage() {
  const [trends, setTrends] = useState<AdminTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminTrends();
      setTrends(data.sort((a, b) => b.score - a.score));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const radarData = buildRadarData(trends);
  const topTrends = trends.slice(0, 5);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Radar Tendances</h1>
          <p className="text-sm text-zinc-500">
            {trends.length} tendance{trends.length > 1 ? "s" : ""} scannées · API live
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
        <p className="text-sm text-zinc-500">Chargement des tendances...</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <TrendingUp className="h-5 w-5 text-accent" />
              Radar par niche
            </h2>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e4e4e7" />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="Score boutique"
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
            ) : (
              <p className="text-sm text-zinc-500">Aucune tendance disponible.</p>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <Flame className="h-5 w-5 text-orange-500" />
              Top tendances
            </h2>
            <div className="space-y-3">
              {topTrends.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-lg border border-zinc-100 p-3 dark:border-zinc-800"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-light text-sm font-bold text-accent dark:bg-accent/20">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.keyword}</p>
                    <p className="text-xs text-zinc-500">
                      {item.platform ?? "multi"} · Score : {item.score.toFixed(1)}/100
                      {item.search_volume ? ` · ${item.search_volume.toLocaleString("fr-FR")} recherches/mois` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                    <ArrowUpRight className="h-4 w-4" />
                    {item.competition ?? "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

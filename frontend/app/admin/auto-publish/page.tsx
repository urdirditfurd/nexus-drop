"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Zap,
  Play,
  ShieldAlert,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  FlaskConical,
} from "lucide-react";
import {
  getAutoPublishStatus,
  updateAutoPublishSettings,
  runAutoPublishCycle,
  getAutoPublishHistory,
  getQuarantineProducts,
  reviveQuarantineProduct,
  runDryRun,
  type AutoPublishStatus,
  type AutoPublishLogEntry,
  type QuarantineProduct,
  type AutoPublishRunResult,
  type DryRunReport,
} from "@/lib/api-client";

export default function AdminAutoPublishPage() {
  const [status, setStatus] = useState<AutoPublishStatus | null>(null);
  const [history, setHistory] = useState<AutoPublishLogEntry[]>([]);
  const [quarantine, setQuarantine] = useState<QuarantineProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<AutoPublishRunResult | null>(null);
  const [dryRunResult, setDryRunResult] = useState<DryRunReport | null>(null);
  const [dryRunLoading, setDryRunLoading] = useState(false);
  const [dryKeyword, setDryKeyword] = useState("tapis de yoga premium antidérapant");
  const [dryEan, setDryEan] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [st, hist, quar] = await Promise.all([
        getAutoPublishStatus(),
        getAutoPublishHistory(),
        getQuarantineProducts(),
      ]);
      setStatus(st);
      setHistory(hist);
      setQuarantine(quar);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, [load]);

  const toggleEnabled = async () => {
    if (!status) return;
    await updateAutoPublishSettings({ enabled: !status.enabled });
    await load();
  };

  const runCycle = async (withManualSeed = false) => {
    setRunning(true);
    setLastResult(null);
    setDryRunResult(null);
    try {
      const seed =
        withManualSeed && dryKeyword.trim()
          ? {
              keyword: dryKeyword.trim(),
              ...(dryEan.trim() ? { ean: dryEan.trim() } : {}),
            }
          : undefined;
      const result = await runAutoPublishCycle(seed);
      setLastResult(result);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cycle échoué");
    } finally {
      setRunning(false);
    }
  };

  const handleRevive = async (id: number) => {
    await reviveQuarantineProduct(id);
    await load();
  };

  const handleDryRun = async () => {
    setDryRunLoading(true);
    setDryRunResult(null);
    setError(null);
    try {
      const report = await runDryRun({
        keyword: dryKeyword,
        ean: dryEan || undefined,
      });
      setDryRunResult(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dry-run échoué");
    } finally {
      setDryRunLoading(false);
    }
  };

  if (loading && !status) {
    return <p className="text-sm text-zinc-500">Chargement auto-publish...</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Zap className="h-6 w-6 text-accent" />
            Auto-Publish
          </h1>
          <p className="text-sm text-zinc-500">
            Pipeline anti-catastrophe — Scan → Source → Prix → Listing → Publish / Quarantaine
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => runCycle(true)}
            disabled={running || !dryKeyword.trim()}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {running ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {running ? "Pipeline..." : "Publier ce mot-clé"}
          </button>
          <button
            onClick={() => runCycle(false)}
            disabled={running}
            className="flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            {running ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Cycle auto (scan trends)
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </p>
      )}

      {lastResult && (
        <div
          className={`rounded-xl border p-4 ${
            lastResult.success
              ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20"
              : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20"
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {lastResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            )}
            {lastResult.success ? "Produit publié" : "Quarantaine"}
            {lastResult.product_id && (
              <span className="text-sm text-zinc-500">#{lastResult.product_id}</span>
            )}
          </div>
          {lastResult.reason && (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{lastResult.reason}</p>
          )}
          {lastResult.steps.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-zinc-500">
              {lastResult.steps.map((s) => (
                <li key={s}>→ {s}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900 dark:bg-blue-900/10">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <FlaskConical className="h-5 w-5 text-blue-600" />
          Dry-Run (test à blanc)
        </h2>
        <p className="mb-4 text-xs text-zinc-500">
          Teste ou publie avec le mot-clé ci-dessous. « Publier ce mot-clé » ignore le scan
          trends et va directement au sourcing/pricing.
        </p>
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <input
            value={dryKeyword}
            onChange={(e) => setDryKeyword(e.target.value)}
            placeholder="Mot-clé"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            value={dryEan}
            onChange={(e) => setDryEan(e.target.value)}
            placeholder="EAN (optionnel)"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <button
          onClick={handleDryRun}
          disabled={dryRunLoading || !dryKeyword.trim()}
          className="flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium hover:bg-blue-50 disabled:opacity-50 dark:border-blue-800 dark:bg-zinc-900"
        >
          {dryRunLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <FlaskConical className="h-4 w-4" />
          )}
          Lancer dry-run
        </button>
        {dryRunResult && (
          <pre className="mt-4 max-h-96 overflow-auto rounded-lg bg-zinc-900 p-4 text-xs text-green-400">
            {JSON.stringify(dryRunResult, null, 2)}
          </pre>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Automatisation" value={status?.enabled ? "ON" : "OFF"} />
        <StatCard
          label="Publiés aujourd'hui"
          value={`${status?.published_today ?? 0} / ${status?.daily_target ?? 200}`}
        />
        <StatCard label="En quarantaine" value={String(status?.quarantine_count ?? 0)} />
        <StatCard label="Catalogue actif" value={String(status?.published_total ?? 0)} />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 font-semibold">Configuration</h2>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={status?.enabled ?? false}
              onChange={toggleEnabled}
              className="h-4 w-4 rounded border-zinc-300 text-accent"
            />
            <span className="text-sm">Automatisation active (scheduler Celery)</span>
          </label>
          {status?.last_run && (
            <span className="text-xs text-zinc-500">
              Dernier cycle : {new Date(status.last_run).toLocaleString("fr-FR")}
            </span>
          )}
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          4 garde-fous prix actifs : parsing, historique, marge 5 % net, compétitivité.
          Toute anomalie → quarantaine, jamais publication directe.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <h2 className="font-semibold">Historique pipeline</h2>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {history.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-zinc-500">Aucun cycle pour le moment.</td>
                  </tr>
                ) : (
                  history.map((row) => (
                    <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                      <td className="px-4 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            row.status === "published"
                              ? "bg-green-50 text-green-700 dark:bg-green-900/30"
                              : row.status === "quarantine"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30"
                                : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {row.action}
                        </span>
                      </td>
                      <td className="px-4 py-2 line-clamp-1">{row.title ?? "—"}</td>
                      <td className="px-4 py-2 text-xs text-zinc-500">
                        {new Date(row.created_at).toLocaleString("fr-FR")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            <h2 className="font-semibold">Quarantaine ({quarantine.length})</h2>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800">
            {quarantine.length === 0 ? (
              <p className="px-4 py-6 text-sm text-zinc-500">Aucun produit en quarantaine.</p>
            ) : (
              quarantine.map((p) => (
                <div key={p.id} className="px-4 py-3">
                  <p className="text-sm font-medium line-clamp-1">{p.title}</p>
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                    {p.quarantine_reason}
                  </p>
                  <button
                    onClick={() => handleRevive(p.id)}
                    className="mt-2 text-xs text-accent hover:underline"
                  >
                    Remettre en draft
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

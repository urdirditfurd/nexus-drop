"use client";

import { useState } from "react";
import { Sparkles, Copy, RefreshCw, Wand2 } from "lucide-react";
import { generateListing } from "@/lib/api";

export default function AdminAiPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    title: string;
    description: string;
    tags: string[];
  } | null>(null);
  const [fallback, setFallback] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    const { data, fallback: fb } = await generateListing(prompt);
    setResult(data);
    setFallback(fb);
    setLoading(false);
  };

  const copyAll = () => {
    if (!result) return;
    const text = `${result.title}\n\n${result.description}\n\nTags: ${result.tags.join(", ")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Sparkles className="h-6 w-6 text-accent" />
          Générateur de listing IA
        </h1>
        <p className="text-sm text-zinc-500">
          Créez des descriptions produit optimisées SEO en un clic
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 font-semibold">Configuration</h2>
          <label className="mb-2 block text-sm text-zinc-500">
            Décrivez votre produit
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={6}
            placeholder="Ex: Écouteurs sans fil avec réduction de bruit, autonomie 40h, design ergonomique, couleur noire..."
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-accent dark:border-zinc-700 dark:bg-zinc-950"
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Générer le listing
              </>
            )}
          </button>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Aperçu</h2>
            {result && (
              <button
                onClick={copyAll}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copié !" : "Copier tout"}
              </button>
            )}
          </div>

          {!result ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
              <p className="text-sm text-zinc-400">
                Le résultat apparaîtra ici
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {fallback && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Mode démo — API indisponible
                </p>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">
                  Titre
                </label>
                <p className="rounded-lg bg-zinc-50 p-3 text-sm font-medium dark:bg-zinc-800">
                  {result.title}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">
                  Description
                </label>
                <p className="rounded-lg bg-zinc-50 p-3 text-sm leading-relaxed dark:bg-zinc-800">
                  {result.description}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">
                  Tags SEO
                </label>
                <div className="flex flex-wrap gap-2">
                  {result.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-accent-light px-3 py-1 text-xs font-medium text-accent dark:bg-accent/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

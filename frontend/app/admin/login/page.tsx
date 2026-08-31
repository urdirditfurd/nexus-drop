"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push("/admin");
    }, 800);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-lg font-bold text-white">
              N
            </div>
          </Link>
          <h1 className="mt-4 text-2xl font-bold">Admin NEXUS-DROP</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Connectez-vous à votre tableau de bord
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-zinc-200 bg-white p-6 shadow-card dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="email"
                required
                defaultValue="admin@nexus-drop.com"
                className="w-full rounded-lg border border-zinc-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-accent dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
          </div>
          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-medium">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="password"
                required
                defaultValue="demo1234"
                className="w-full rounded-lg border border-zinc-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-accent dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-zinc-400">
          <Link href="/" className="hover:text-accent">
            ← Retour à la boutique
          </Link>
        </p>
      </div>
    </div>
  );
}

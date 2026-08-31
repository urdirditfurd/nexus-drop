"use client";

import { Store, Globe, Bell, Shield, CreditCard } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-sm text-zinc-500">
          Configuration de votre boutique NEXUS-DROP
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {[
          {
            icon: Store,
            title: "Informations boutique",
            fields: [
              { label: "Nom de la boutique", value: "NEXUS-DROP" },
              { label: "Email de contact", value: "contact@nexus-drop.com" },
              { label: "Devise", value: "EUR (€)" },
            ],
          },
          {
            icon: Globe,
            title: "Domaine & SEO",
            fields: [
              { label: "Domaine", value: "nexus-drop.com" },
              { label: "Meta title", value: "NEXUS-DROP — Boutique Premium" },
            ],
          },
          {
            icon: CreditCard,
            title: "Paiements",
            fields: [
              { label: "Stripe", value: "Connecté" },
              { label: "PayPal", value: "Connecté" },
            ],
          },
          {
            icon: Bell,
            title: "Notifications",
            fields: [
              { label: "Email nouvelles commandes", value: "Activé" },
              { label: "Alertes stock bas", value: "Activé" },
            ],
          },
          {
            icon: Shield,
            title: "Sécurité",
            fields: [
              { label: "Authentification 2FA", value: "Désactivé" },
              { label: "Dernière connexion", value: "Aujourd'hui, 14:32" },
            ],
          },
        ].map((section) => (
          <div
            key={section.title}
            className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="mb-4 flex items-center gap-2">
              <section.icon className="h-5 w-5 text-accent" />
              <h2 className="font-semibold">{section.title}</h2>
            </div>
            <div className="space-y-3">
              {section.fields.map((field) => (
                <div key={field.label}>
                  <label className="mb-1 block text-xs text-zinc-500">
                    {field.label}
                  </label>
                  <input
                    defaultValue={field.value}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-accent dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <button className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-accent-hover">
          Enregistrer les modifications
        </button>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Package, MapPin, CreditCard, User } from "lucide-react";

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="mb-8 text-2xl font-bold sm:text-3xl">Mon compte</h1>

      <div className="mb-8 flex items-center gap-4 rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-light text-2xl font-bold text-accent dark:bg-accent/20">
          JD
        </div>
        <div>
          <h2 className="text-lg font-semibold">Jean Dupont</h2>
          <p className="text-sm text-zinc-500">jean.dupont@email.com</p>
          <p className="text-xs text-zinc-400">Client depuis août 2024</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          {
            icon: Package,
            title: "Mes commandes",
            desc: "Historique et suivi",
            href: "/orders/ORD-2024-001234",
          },
          {
            icon: MapPin,
            title: "Adresses",
            desc: "Gérer vos adresses de livraison",
            href: "#",
          },
          {
            icon: CreditCard,
            title: "Paiements",
            desc: "Moyens de paiement enregistrés",
            href: "#",
          },
          {
            icon: User,
            title: "Profil",
            desc: "Modifier vos informations",
            href: "#",
          },
        ].map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="flex items-start gap-4 rounded-xl border border-zinc-200 p-5 transition hover:border-accent hover:shadow-card dark:border-zinc-800"
          >
            <item.icon className="mt-0.5 h-5 w-5 text-accent" />
            <div>
              <h3 className="font-medium">{item.title}</h3>
              <p className="text-sm text-zinc-500">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

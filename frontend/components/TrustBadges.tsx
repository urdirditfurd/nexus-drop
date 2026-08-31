import { Shield, Truck, RotateCcw, CreditCard } from "lucide-react";

const badges = [
  { icon: Truck, label: "Livraison gratuite", sub: "Dès 50€ d'achat" },
  { icon: Shield, label: "Paiement sécurisé", sub: "SSL & 3D Secure" },
  { icon: RotateCcw, label: "Retours 30 jours", sub: "Satisfait ou remboursé" },
  { icon: CreditCard, label: "Paiement flexible", sub: "CB, PayPal, Klarna" },
];

export function TrustBadges({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
        {badges.map((b) => (
          <div key={b.label} className="flex items-center gap-1.5">
            <b.icon className="h-4 w-4 text-accent" />
            <span>{b.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {badges.map((b) => (
        <div
          key={b.label}
          className="flex flex-col items-center rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-center dark:border-zinc-800 dark:bg-zinc-900"
        >
          <b.icon className="mb-2 h-6 w-6 text-accent" />
          <span className="text-sm font-medium">{b.label}</span>
          <span className="mt-0.5 text-xs text-zinc-500">{b.sub}</span>
        </div>
      ))}
    </div>
  );
}

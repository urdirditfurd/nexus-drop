import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
                N
              </div>
              <span className="font-semibold">NEXUS-DROP</span>
            </div>
            <p className="text-sm text-zinc-500">
              Votre boutique dropshipping premium. Qualité, rapidité, confiance.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Boutique</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>
                <Link href="/collections/tech-gadgets" className="hover:text-accent">
                  Tech & Gadgets
                </Link>
              </li>
              <li>
                <Link href="/collections/home-living" className="hover:text-accent">
                  Maison
                </Link>
              </li>
              <li>
                <Link href="/collections/fitness" className="hover:text-accent">
                  Fitness
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Aide</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>
                <Link href="/account" className="hover:text-accent">
                  Mon compte
                </Link>
              </li>
              <li>
                <Link href="/orders/ORD-2024-001234" className="hover:text-accent">
                  Suivi commande
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Légal</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>CGV</li>
              <li>Politique de confidentialité</li>
              <li>Retours & remboursements</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-zinc-200 pt-8 text-center text-xs text-zinc-400 dark:border-zinc-800">
          © {new Date().getFullYear()} NEXUS-DROP. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}

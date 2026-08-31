import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { getCollections, getTrendingProducts } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { TrustBadges } from "@/components/TrustBadges";
import { EmptyState } from "@/components/EmptyState";

export default async function HomePage() {
  const [{ data: collections, fallback: collFallback }, { data: trending, fallback: trendFallback }] =
    await Promise.all([getCollections(), getTrendingProducts()]);

  const displayTrending =
    trending.length > 0 ? trending : (await import("@/lib/demo-data")).DEMO_PRODUCTS.slice(0, 4);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-accent-light via-white to-zinc-50 dark:from-accent/10 dark:via-zinc-950 dark:to-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                <Sparkles className="h-3.5 w-3.5" />
                Nouvelle collection disponible
              </div>
              <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Les produits tendance,{" "}
                <span className="text-accent">livrés chez vous</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg text-zinc-600 dark:text-zinc-400">
                NEXUS-DROP sélectionne les meilleurs produits dropshipping.
                Qualité premium, livraison rapide, satisfaction garantie.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/collections/tech-gadgets"
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-hover"
                >
                  Découvrir la boutique
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/products/ecouteurs-sans-fil-pro"
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Produit vedette
                </Link>
              </div>
            </div>
            <div className="relative hidden aspect-square lg:block">
              <Image
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=800&fit=crop"
                alt="Boutique NEXUS-DROP"
                fill
                className="rounded-2xl object-cover shadow-elevated"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Collections
            </h2>
            <p className="mt-2 text-zinc-500">
              Explorez nos univers produits
            </p>
          </div>
        </div>
        {collections.length === 0 ? (
          <EmptyState
            title="Aucune collection"
            description="Les collections seront bientôt disponibles."
          />
        ) : (
          <>
            {collFallback && (
              <p className="mb-4 text-xs text-amber-600 dark:text-amber-400">
                Mode démo — API indisponible
              </p>
            )}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {collections.map((col) => (
                <Link
                  key={col.id}
                  href={`/collections/${col.slug}`}
                  className="group relative overflow-hidden rounded-xl"
                >
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={col.image}
                      alt={col.name}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 p-4 text-white">
                    <h3 className="font-semibold">{col.name}</h3>
                    <p className="text-sm opacity-80">
                      {col.productCount} produits
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="bg-zinc-50 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Tendances du moment
            </h2>
            <p className="mt-2 text-zinc-500">
              Les produits les plus populaires cette semaine
            </p>
          </div>
          {displayTrending.length === 0 ? (
            <EmptyState title="Aucun produit trending" fallback={trendFallback} />
          ) : (
            <>
              {trendFallback && (
                <p className="mb-4 text-xs text-amber-600 dark:text-amber-400">
                  Mode démo — API indisponible
                </p>
              )}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {displayTrending.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <TrustBadges />
      </section>
    </>
  );
}

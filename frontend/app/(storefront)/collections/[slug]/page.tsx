import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCollectionBySlug, getProductsByCollection } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState } from "@/components/EmptyState";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
  const { data: collection } = await getCollectionBySlug(params.slug);
  return {
    title: collection
      ? `${collection.name} — NEXUS-DROP`
      : "Collection — NEXUS-DROP",
  };
}

export default async function CollectionPage({ params }: Props) {
  const [{ data: collection }, { data: products, fallback }] =
    await Promise.all([
      getCollectionBySlug(params.slug),
      getProductsByCollection(params.slug),
    ]);

  if (!collection) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="relative mb-10 overflow-hidden rounded-2xl">
        <div className="relative aspect-[21/9] min-h-[200px]">
          <Image
            src={collection.image}
            alt={collection.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 p-6 sm:p-10">
          <nav className="mb-2 text-sm text-white/70">
            <Link href="/" className="hover:text-white">
              Accueil
            </Link>
            <span className="mx-2">/</span>
            <span>{collection.name}</span>
          </nav>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            {collection.name}
          </h1>
          <p className="mt-2 max-w-lg text-white/80">
            {collection.description}
          </p>
        </div>
      </div>

      {fallback && (
        <p className="mb-4 text-xs text-amber-600 dark:text-amber-400">
          Mode démo — API indisponible
        </p>
      )}

      {products.length === 0 ? (
        <EmptyState
          title="Aucun produit dans cette collection"
          description="Revenez bientôt, de nouveaux produits arrivent."
          fallback={fallback}
        />
      ) : (
        <>
          <p className="mb-6 text-sm text-zinc-500">
            {products.length} produit{products.length > 1 ? "s" : ""}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

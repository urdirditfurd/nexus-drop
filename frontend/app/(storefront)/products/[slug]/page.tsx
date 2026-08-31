import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/api";
import { ProductPageClient } from "@/components/ProductPageClient";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
  const { data: product } = await getProductBySlug(params.slug);
  return {
    title: product ? `${product.name} — NEXUS-DROP` : "Produit — NEXUS-DROP",
  };
}

export default async function ProductPage({ params }: Props) {
  const { data: product, fallback } = await getProductBySlug(params.slug);

  if (!product) notFound();

  return <ProductPageClient product={product} fallback={fallback} />;
}

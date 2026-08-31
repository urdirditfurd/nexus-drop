import type { Collection, Order, Product } from "./demo-data";
import {
  DEMO_COLLECTIONS,
  DEMO_ORDER,
  DEMO_PRODUCTS,
} from "./demo-data";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new ApiError(`API error: ${res.statusText}`, res.status);
  }

  return res.json() as Promise<T>;
}

export async function getProducts(): Promise<{
  data: Product[];
  fallback: boolean;
}> {
  try {
    const data = await fetchApi<Product[]>("/api/products");
    return { data, fallback: false };
  } catch {
    return { data: DEMO_PRODUCTS, fallback: true };
  }
}

export async function getTrendingProducts(): Promise<{
  data: Product[];
  fallback: boolean;
}> {
  try {
    const data = await fetchApi<Product[]>("/api/products/trending");
    return { data, fallback: false };
  } catch {
    return {
      data: DEMO_PRODUCTS.filter((p) => p.tags?.includes("trending")),
      fallback: true,
    };
  }
}

export async function getProductBySlug(slug: string): Promise<{
  data: Product | null;
  fallback: boolean;
}> {
  try {
    const data = await fetchApi<Product>(`/api/products/${slug}`);
    return { data, fallback: false };
  } catch {
    const product = DEMO_PRODUCTS.find((p) => p.slug === slug) ?? null;
    return { data: product, fallback: true };
  }
}

export async function getCollections(): Promise<{
  data: Collection[];
  fallback: boolean;
}> {
  try {
    const data = await fetchApi<Collection[]>("/api/collections");
    return { data, fallback: false };
  } catch {
    return { data: DEMO_COLLECTIONS, fallback: true };
  }
}

export async function getCollectionBySlug(slug: string): Promise<{
  data: Collection | null;
  fallback: boolean;
}> {
  try {
    const data = await fetchApi<Collection>(`/api/collections/${slug}`);
    return { data, fallback: false };
  } catch {
    const collection = DEMO_COLLECTIONS.find((c) => c.slug === slug) ?? null;
    return { data: collection, fallback: true };
  }
}

export async function getProductsByCollection(
  slug: string,
): Promise<{ data: Product[]; fallback: boolean }> {
  try {
    const data = await fetchApi<Product[]>(
      `/api/collections/${slug}/products`,
    );
    return { data, fallback: false };
  } catch {
    const data = DEMO_PRODUCTS.filter((p) => p.collectionSlug === slug);
    return { data, fallback: true };
  }
}

export async function getOrder(id: string): Promise<{
  data: Order | null;
  fallback: boolean;
}> {
  try {
    const data = await fetchApi<Order>(`/api/orders/${id}`);
    return { data, fallback: false };
  } catch {
    return { data: id === DEMO_ORDER.id ? DEMO_ORDER : null, fallback: true };
  }
}

export async function getAdminKpis(): Promise<{
  data: Record<string, number>;
  fallback: boolean;
}> {
  try {
    const data = await fetchApi<Record<string, number>>("/api/admin/kpis");
    return { data, fallback: false };
  } catch {
    return {
      data: {
        revenue: 45890,
        orders: 127,
        visitors: 3420,
        conversionRate: 3.7,
        avgOrderValue: 3610,
        productsSold: 389,
      },
      fallback: true,
    };
  }
}

export async function getAdminChartData(): Promise<{
  data: { name: string; revenue: number; orders: number }[];
  fallback: boolean;
}> {
  try {
    const data = await fetchApi<
      { name: string; revenue: number; orders: number }[]
    >("/api/admin/chart");
    return { data, fallback: false };
  } catch {
    return {
      data: [
        { name: "Lun", revenue: 4200, orders: 12 },
        { name: "Mar", revenue: 5800, orders: 18 },
        { name: "Mer", revenue: 3900, orders: 10 },
        { name: "Jeu", revenue: 7100, orders: 22 },
        { name: "Ven", revenue: 8900, orders: 28 },
        { name: "Sam", revenue: 6200, orders: 19 },
        { name: "Dim", revenue: 4800, orders: 14 },
      ],
      fallback: true,
    };
  }
}

export async function generateListing(prompt: string): Promise<{
  data: { title: string; description: string; tags: string[] } | null;
  fallback: boolean;
}> {
  try {
    const data = await fetchApi<{
      title: string;
      description: string;
      tags: string[];
    }>("/api/ai/generate", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    });
    return { data, fallback: false };
  } catch {
    return {
      data: {
        title: "Produit Premium — Édition Limitée",
        description: `Découvrez notre produit exclusif : ${prompt}. Conçu avec des matériaux de haute qualité, il allie design moderne et fonctionnalité premium. Livraison gratuite et garantie satisfait ou remboursé 30 jours.`,
        tags: ["premium", "trending", "nouveau", "bestseller"],
      },
      fallback: true,
    };
  }
}

export { DEMO_PRODUCTS, DEMO_COLLECTIONS, DEMO_ORDER };

import type { Collection, Order, Product } from "./types";

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

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new ApiError(`API error: ${res.statusText}`, res.status);
  }

  return res.json() as Promise<T>;
}

export async function getProducts(): Promise<Product[]> {
  return fetchApi<Product[]>("/api/products");
}

export async function getTrendingProducts(): Promise<Product[]> {
  return fetchApi<Product[]>("/api/products/trending");
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    return await fetchApi<Product>(`/api/products/${slug}`);
  } catch {
    return null;
  }
}

export async function getCollections(): Promise<Collection[]> {
  return fetchApi<Collection[]>("/api/collections");
}

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  try {
    return await fetchApi<Collection>(`/api/collections/${slug}`);
  } catch {
    return null;
  }
}

export async function getProductsByCollection(slug: string): Promise<Product[]> {
  return fetchApi<Product[]>(`/api/collections/${slug}/products`);
}

export async function getOrder(id: string): Promise<Order | null> {
  try {
    return await fetchApi<Order>(`/api/orders/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

export async function generateListing(prompt: string): Promise<{
  title: string;
  description: string;
  tags: string[];
} | null> {
  try {
    return await fetchApi("/api/ai/generate", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    });
  } catch {
    return null;
  }
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  images?: string[];
  collection?: string;
  collectionSlug?: string;
  rating?: number;
  reviewCount?: number;
  tags?: string[];
  inStock?: boolean;
}

export interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  productCount: number;
}

export interface Order {
  id: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
  total: number;
  items: { product: Product; quantity: number }[];
  trackingNumber?: string;
  trackingSteps?: { label: string; date: string; completed: boolean }[];
}

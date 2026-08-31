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

export const DEMO_COLLECTIONS: Collection[] = [
  {
    id: "1",
    slug: "tech-gadgets",
    name: "Tech & Gadgets",
    description: "Les dernières innovations tech pour votre quotidien.",
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=400&fit=crop",
    productCount: 12,
  },
  {
    id: "2",
    slug: "home-living",
    name: "Maison & Décoration",
    description: "Transformez votre intérieur avec style.",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop",
    productCount: 18,
  },
  {
    id: "3",
    slug: "fitness",
    name: "Fitness & Bien-être",
    description: "Équipez-vous pour atteindre vos objectifs.",
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop",
    productCount: 9,
  },
  {
    id: "4",
    slug: "accessories",
    name: "Accessoires",
    description: "Les petits détails qui font la différence.",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=400&fit=crop",
    productCount: 24,
  },
];

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "p1",
    slug: "ecouteurs-sans-fil-pro",
    name: "Écouteurs Sans Fil Pro",
    description:
      "Écouteurs Bluetooth 5.3 avec réduction de bruit active, autonomie 40h et son Hi-Fi premium. Parfaits pour le travail et les voyages.",
    price: 4999,
    compareAtPrice: 7999,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&h=800&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=800&fit=crop",
    ],
    collection: "Tech & Gadgets",
    collectionSlug: "tech-gadgets",
    rating: 4.8,
    reviewCount: 234,
    tags: ["trending", "bestseller"],
    inStock: true,
  },
  {
    id: "p2",
    slug: "montre-connectee-elite",
    name: "Montre Connectée Elite",
    description:
      "Montre intelligente avec suivi santé avancé, GPS intégré et écran AMOLED toujours allumé. Étanche IP68.",
    price: 8999,
    compareAtPrice: 12999,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1434493782177-86c23fcb06b9?w=800&h=800&fit=crop",
    ],
    collection: "Tech & Gadgets",
    collectionSlug: "tech-gadgets",
    rating: 4.6,
    reviewCount: 189,
    tags: ["trending"],
    inStock: true,
  },
  {
    id: "p3",
    slug: "lampe-design-minimaliste",
    name: "Lampe Design Minimaliste",
    description:
      "Lampe de bureau LED avec variateur de luminosité et port USB-C. Design scandinave en aluminium brossé.",
    price: 3499,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&h=800&fit=crop",
    collection: "Maison & Décoration",
    collectionSlug: "home-living",
    rating: 4.9,
    reviewCount: 67,
    inStock: true,
  },
  {
    id: "p4",
    slug: "tapis-yoga-premium",
    name: "Tapis de Yoga Premium",
    description:
      "Tapis antidérapant en caoutchouc naturel, épaisseur 6mm. Inclus sangle de transport et sac.",
    price: 2999,
    compareAtPrice: 4499,
    image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&h=800&fit=crop",
    collection: "Fitness & Bien-être",
    collectionSlug: "fitness",
    rating: 4.7,
    reviewCount: 312,
    tags: ["bestseller"],
    inStock: true,
  },
  {
    id: "p5",
    slug: "organisateur-bureau",
    name: "Organisateur de Bureau",
    description:
      "Set de rangement en bambou avec compartiments multiples. Gardez votre espace de travail impeccable.",
    price: 2499,
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop",
    collection: "Maison & Décoration",
    collectionSlug: "home-living",
    rating: 4.5,
    reviewCount: 98,
    inStock: true,
  },
  {
    id: "p6",
    slug: "chargeur-solaire-portable",
    name: "Chargeur Solaire Portable",
    description:
      "Panneau solaire pliable 20000mAh, charge rapide USB-C et wireless. Idéal pour le camping et les voyages.",
    price: 5999,
    compareAtPrice: 8999,
    image: "https://images.unsplash.com/photo-1609091839311-5c3c2c0e0a1b?w=800&h=800&fit=crop",
    collection: "Tech & Gadgets",
    collectionSlug: "tech-gadgets",
    rating: 4.4,
    reviewCount: 156,
    tags: ["trending", "new"],
    inStock: true,
  },
  {
    id: "p7",
    slug: "sac-a-dos-urban",
    name: "Sac à Dos Urban",
    description:
      "Sac à dos imperméable avec compartiment laptop 15\", port USB et design épuré.",
    price: 4499,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop",
    collection: "Accessoires",
    collectionSlug: "accessories",
    rating: 4.6,
    reviewCount: 203,
    inStock: true,
  },
  {
    id: "p8",
    slug: "bouteille-isotherme",
    name: "Bouteille Isotherme 750ml",
    description:
      "Garde vos boissons froides 24h ou chaudes 12h. Acier inoxydable, sans BPA.",
    price: 1999,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&h=800&fit=crop",
    collection: "Fitness & Bien-être",
    collectionSlug: "fitness",
    rating: 4.8,
    reviewCount: 445,
    tags: ["bestseller"],
    inStock: true,
  },
];

export const DEMO_ORDER: Order = {
  id: "ORD-2024-001234",
  status: "shipped",
  createdAt: "2024-08-28T10:30:00Z",
  total: 13497,
  items: [
    { product: DEMO_PRODUCTS[0], quantity: 1 },
    { product: DEMO_PRODUCTS[3], quantity: 2 },
  ],
  trackingNumber: "NXD-FR-789456123",
  trackingSteps: [
    { label: "Commande confirmée", date: "28 août 2024", completed: true },
    { label: "Préparation en cours", date: "29 août 2024", completed: true },
    { label: "Expédiée", date: "30 août 2024", completed: true },
    { label: "En transit", date: "31 août 2024", completed: false },
    { label: "Livrée", date: "—", completed: false },
  ],
};

export const DEMO_REVIEWS = [
  {
    id: "r1",
    author: "Marie L.",
    rating: 5,
    date: "15 août 2024",
    text: "Excellent produit, livraison rapide. Je recommande vivement !",
  },
  {
    id: "r2",
    author: "Thomas D.",
    rating: 4,
    date: "10 août 2024",
    text: "Très bon rapport qualité-prix. Petit bémol sur l'emballage.",
  },
  {
    id: "r3",
    author: "Sophie M.",
    rating: 5,
    date: "5 août 2024",
    text: "Parfait ! Correspond exactement à la description.",
  },
];

"use client";

import { useState } from "react";
import { ShoppingCart, Check, Minus, Plus } from "lucide-react";
import { useCartStore } from "@/lib/cart";
import type { Product } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  product: Product;
  className?: string;
  showQuantity?: boolean;
}

export function AddToCartButton({
  product,
  className,
  showQuantity = false,
}: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {showQuantity && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">Quantité</span>
          <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Diminuer"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-sm font-medium">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Augmenter"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={handleAdd}
        disabled={!product.inStock}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-white transition",
          added
            ? "bg-green-600"
            : "bg-accent hover:bg-accent-hover",
          !product.inStock && "cursor-not-allowed opacity-50",
        )}
      >
        {added ? (
          <>
            <Check className="h-5 w-5" />
            Ajouté au panier
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5" />
            {product.inStock ? "Ajouter au panier" : "Rupture de stock"}
          </>
        )}
      </button>
    </div>
  );
}

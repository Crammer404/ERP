// src/components/pos/ProductCard.tsx
"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import type { Product as PosProduct } from "../hooks/useProducts";

export default function ProductCard({
  product,
  onSelect,
}: {
  product: PosProduct;
  onSelect: (product: PosProduct) => void;
}) {
  return (
    <Card
      onClick={() => onSelect(product)}
      className="overflow-hidden transition-all hover:shadow-xl hover:bg-secondary/50 cursor-pointer h-full
      flex flex-col group rounded-xl border border-border/20 shadow-md bg-background/50"
    >
      <CardContent className="px-4 py-2 flex flex-col flex-grow items-center text-center">
        <div className="relative w-16 h-16 mb-3">
          <Image
            src={product.image || '/placeholder.png'}
            alt={product.name}
            fill
            className="object-contain"
            sizes="64px"
            unoptimized
            data-ai-hint={`${product.category.name} product`}
          />
        </div>

        <p className="text-xs font-medium leading-snug flex-grow group-hover:text-primary px-2">
          {product.name}
        </p>
      </CardContent>
    </Card>
  );
}

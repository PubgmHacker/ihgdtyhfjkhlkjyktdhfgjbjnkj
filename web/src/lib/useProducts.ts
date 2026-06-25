"use client";

import { useEffect, useState } from "react";
import { Product } from "@/lib/types";
import { allProducts } from "@/lib/products";

interface ApiProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  fullDescription: string;
  price: string;
  oldPrice: string | null;
  category: string;
  gender: string;
  collection: string;
  images: string[];
  sizes: string[];
  details: string[];
  material: string;
  care: string;
  badge: "NEW" | "HIT" | "SALE" | null;
  stock: number;
  gradient: string;
  pattern: string;
  icon: string;
}

function toProduct(p: ApiProduct): Product {
  return {
    id: p.id || p.slug,
    slug: p.slug || undefined,
    name: p.name,
    price: p.price,
    oldPrice: p.oldPrice || undefined,
    category: p.category,
    gender: (p.gender as Product["gender"]) || "Унисекс",
    collection: p.collection || "",
    description: p.description || undefined,
    fullDescription: p.fullDescription || undefined,
    details: p.details,
    material: p.material || undefined,
    care: p.care || undefined,
    sizes: p.sizes,
    image: p.images?.[0],
    images: p.images,
    stock: p.stock,
    badge: p.badge,
    gradient: p.gradient || "from-[#101014] via-[#1a1a20] to-[#0e0e12]",
    pattern: (p.pattern as Product["pattern"]) || undefined,
    icon: (p.icon as Product["icon"]) || "tee",
  };
}

const fallbackProducts: Product[] = allProducts;

export function useProducts(): { products: Product[]; loading: boolean } {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/products")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (!alive) return;
        const list: ApiProduct[] = Array.isArray(data?.products) ? data.products : [];
        if (list.length) setProducts(list.map(toProduct));
      })
      .catch(() => {
        /* keep static fallback */
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { products, loading };
}
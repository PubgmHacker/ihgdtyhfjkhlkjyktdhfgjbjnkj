"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

function ViewRedirect() {
  const params = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const v = params.get("view");
    if (v === "admin") router.replace("/admin");
    if (v === "faq") router.replace("/faq");
  }, [params, router]);
  return null;
}
import HeroSection from "@/components/HeroSection";
import CollectionShowcase from "@/components/CollectionShowcase";
import ManifestoSection from "@/components/ManifestoSection";
import CommunitySelect from "@/components/CommunitySelect";
import BrandPhilosophy from "@/components/BrandPhilosophy";
import Lookbook from "@/components/Lookbook";
import Reviews from "@/components/Reviews";
import ProductModal from "@/components/ProductModal";
import type { Product } from "@/lib/types";

const EASE = [0.22, 1, 0.36, 1] as const;

function ScrollSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ y: 50 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <>
      <Suspense><ViewRedirect /></Suspense>
      <HeroSection />
      <ScrollSection>
        <CollectionShowcase onProductClick={setSelectedProduct} />
      </ScrollSection>
      <ScrollSection>
        <ManifestoSection />
      </ScrollSection>
      <ScrollSection>
        <CommunitySelect onProductClick={setSelectedProduct} />
      </ScrollSection>
      <ScrollSection>
        <BrandPhilosophy />
      </ScrollSection>
      <ScrollSection>
        <Lookbook />
      </ScrollSection>
      <ScrollSection>
        <Reviews />
      </ScrollSection>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
}
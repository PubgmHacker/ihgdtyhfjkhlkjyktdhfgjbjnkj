import HeroSection from "@/components/HeroSection";
import Marquee from "@/components/Marquee";
import FeaturedCollection from "@/components/FeaturedCollection";
import Lookbook from "@/components/Lookbook";
import BrandPhilosophy from "@/components/BrandPhilosophy";
import Newsletter from "@/components/Newsletter";

export default function Home() {
  return (
    <>
      <HeroSection />
      <Marquee />
      <FeaturedCollection />
      <Lookbook />
      <BrandPhilosophy />
      <Newsletter />
    </>
  );
}

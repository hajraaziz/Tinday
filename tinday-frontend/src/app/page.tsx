import NavBar from "@/components/landing/NavBar";
import HeroSection from "@/components/landing/HeroSection";
import FeatureCards from "@/components/landing/FeatureCards";
import SocialProof from "@/components/landing/SocialProof";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen relative" style={{ background: "#0A090F" }}>
      <NavBar />
      <HeroSection />
      <FeatureCards />
      <SocialProof />
      <Footer />
    </div>
  );
}

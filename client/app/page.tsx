import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import StatsBar from "./components/StatsBar";
import HowItWorks from "./components/HowItWorks";
import Features from "./components/Features";
import PricingSection from "./components/PricingSection";
import Testimonials from "./components/Testimonials";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";

export default function Page() {
  return (
    // Outer screen wrapper (handles background color)
    <div className="min-h-screen w-full bg-[#f8fafc]">
      {/* 
        CENTRAL BOXED CONTAINER:
        Everything (Navbar, Hero, Metrics, Workflow, Features, Pricing, Testimonials, CTA, Footer) lives inside this wrapper.
        max-w-[1240px], mx-auto, and px-6.
      */}
      <div className="boxed-container mx-auto max-w-[1240px] px-6">
        {/* 1. NAVBAR */}
        <Navbar />

        {/* 2. HERO SECTION */}
        <HeroSection />

        {/* 3. METRICS / STATS BAR */}
        <StatsBar />

        {/* 4. WORKFLOW SECTION */}
        <HowItWorks />

        {/* 5. SERVICES / FEATURES */}
        <Features />

        {/* 6. REVIEWS / TESTIMONIALS */}
        <Testimonials />

        {/* 7. PRICING & PLANS */}
        <PricingSection />

        {/* 8. CTA SECTION */}
        <CTASection />

        {/* 9. FOOTER */}
        <Footer />
      </div>
    </div>
  );
}

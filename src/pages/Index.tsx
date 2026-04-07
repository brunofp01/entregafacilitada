import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProblemSolution from "@/components/ProblemSolution";
import HowItWorks from "@/components/HowItWorks";
import UserProfiles from "@/components/UserProfiles";
import PricingSimulator from "@/components/PricingSimulator";
import FAQ from "@/components/FAQ";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <ProblemSolution />
      <HowItWorks />
      <PricingSimulator />
      <FAQ />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;

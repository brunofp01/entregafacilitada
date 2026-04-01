import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProblemSolution from "@/components/ProblemSolution";
import HowItWorks from "@/components/HowItWorks";
import UserProfiles from "@/components/UserProfiles";
import Plans from "@/components/Plans";
import PricingSimulator from "@/components/PricingSimulator";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <ProblemSolution />
      <UserProfiles />
      <HowItWorks />
      <Plans />
      <PricingSimulator />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;

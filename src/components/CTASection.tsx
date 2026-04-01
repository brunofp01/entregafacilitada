import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center rounded-3xl p-12 md:p-16 text-primary-foreground"
          style={{ background: "var(--gradient-hero)" }}
        >
          <h2 className="text-3xl md:text-4xl font-heading font-extrabold mb-4">
            Pronto para entregar sem estresse?
          </h2>
          <p className="text-primary-foreground/60 text-lg mb-8 max-w-lg mx-auto">
            Simule seu pacote agora e descubra como é fácil transformar a desocupação em algo previsível.
          </p>
          <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold px-8 py-6 text-base shadow-[var(--shadow-accent)]">
            Começar agora
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center rounded-3xl p-12 md:p-16 text-primary-foreground"
          style={{ background: "var(--gradient-hero)" }}
        >
          <h2 className="text-3xl md:text-5xl font-heading font-extrabold mb-4">
            Sua única preocupação na mudança será fazer as malas.
          </h2>
          <p className="text-primary-foreground/70 text-lg mb-8 max-w-2xl mx-auto">
            Descubra em segundos o valor exato para garantir a sua vistoria aprovada. Deixe o trabalho pesado com a gente e mude de casa sem surpresas ou orçamentos abusivos.
          </p>
          <Button
            size="lg"
            onClick={() => document.getElementById('simulador')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-black px-10 py-7 text-lg shadow-[var(--shadow-accent)] uppercase tracking-tight"
          >
            QUERO SIMULAR MEU VALOR
            <ArrowRight className="ml-2 w-6 h-6" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;

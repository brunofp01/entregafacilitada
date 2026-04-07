import { motion } from "framer-motion";
import { ArrowRight, Shield, Clock, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-building.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="Edifício moderno" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, hsl(220 60% 10% / 0.88), hsl(220 50% 20% / 0.75))" }} />
      </div>

      <div className="container relative z-10 py-20">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary/20 px-4 py-1.5 text-sm font-medium text-secondary mb-6">
              <Shield className="w-4 h-4" />
              100% alinhado ao Laudo de Vistoria
            </span>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-extrabold leading-[1.05] tracking-tight text-white mb-6">
              Mude de casa <span className="text-secondary">sem surpresas</span> e sem brigar com a imobiliária.
            </h1>

            <p className="text-lg md:text-xl text-white/70 max-w-2xl mb-10 leading-relaxed">
              Pintura e pequenos reparos garantidos na rescisão por uma assinatura mensal que cabe no seu bolso.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 mb-16"
          >
            <Button
              size="lg"
              onClick={() => document.getElementById('simulador')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base font-bold px-8 py-6 shadow-[var(--shadow-accent)] transition-all"
            >
              Simular minha parcela agora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
              className="border-white text-white bg-transparent hover:bg-white hover:text-primary-foreground text-base px-8 py-6 transition-all"
            >
              Como funciona
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            {[
              { icon: Shield, label: "Conformidade", value: "100% alinhado ao Laudo" },
              { icon: Wallet, label: "Pagamento", value: "Parcelas em até 24x" },
              { icon: Clock, label: "Zero Estresse", value: "Sem surpresas na saída" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary/20">
                  <item.icon className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-heading font-bold text-white">{item.value}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

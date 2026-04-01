import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Essencial",
    description: "O básico para sair sem dor de cabeça.",
    highlight: false,
    features: [
      { text: "Pintura completa do imóvel", included: true },
      { text: "Limpeza geral pós-obra", included: true },
      { text: "Certificado Nada Consta", included: true },
      { text: "Reparos em alvenaria e gesso", included: false },
      { text: "Troca de pisos e revestimentos", included: false },
      { text: "Reparos elétricos e hidráulicos", included: false },
    ],
  },
  {
    name: "Completo",
    description: "O mais escolhido. Cobertura ampla e tranquilidade total.",
    highlight: true,
    features: [
      { text: "Pintura completa do imóvel", included: true },
      { text: "Limpeza geral pós-obra", included: true },
      { text: "Certificado Nada Consta", included: true },
      { text: "Reparos em alvenaria e gesso", included: true },
      { text: "Troca de pisos e revestimentos", included: true },
      { text: "Reparos elétricos e hidráulicos", included: false },
    ],
  },
  {
    name: "Premium",
    description: "Cobertura total para imóveis de alto padrão.",
    highlight: false,
    features: [
      { text: "Pintura completa do imóvel", included: true },
      { text: "Limpeza geral pós-obra", included: true },
      { text: "Certificado Nada Consta", included: true },
      { text: "Reparos em alvenaria e gesso", included: true },
      { text: "Troca de pisos e revestimentos", included: true },
      { text: "Reparos elétricos e hidráulicos", included: true },
    ],
  },
];

const Plans = () => {
  return (
    <section className="py-24 bg-muted/50" id="planos">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-foreground mb-4">
            Escolha seu <span className="text-secondary">plano</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Pacotes pensados para cada necessidade. Todos com parcelas fixas em 12x.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl border p-8 flex flex-col ${
                plan.highlight
                  ? "border-secondary bg-card shadow-[var(--shadow-accent)]"
                  : "border-border bg-card shadow-[var(--shadow-soft)]"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-secondary text-secondary-foreground text-xs font-bold px-4 py-1">
                  Mais popular
                </span>
              )}

              <h3 className="text-xl font-heading font-bold text-foreground mb-1">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm">
                    {feature.included ? (
                      <Check className="w-4 h-4 text-secondary shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                    )}
                    <span className={feature.included ? "text-foreground" : "text-muted-foreground/50"}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlight ? "secondary" : "outline"}
                className="w-full"
              >
                Simular valor
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Plans;

import { motion } from "framer-motion";
import { FileText, CreditCard, CalendarCheck, ClipboardCheck, Paintbrush, Key } from "lucide-react";

const steps = [
  {
    icon: CreditCard,
    title: "Simule e Planeje",
    description: "Descubra o valor exato para o seu imóvel e pague aos poucos, mês a mês. Você mora com a tranquilidade de saber que a entrega será facilitada.",
    side: "você",
  },
  {
    icon: CalendarCheck,
    title: "Agende sua desocupação",
    description: "Faltando 30 dias para devolver o imóvel, basta nos avisar. Você foca na sua mudança e em curtir a casa nova, enquanto nós assumimos o trabalho de deixar o imóvel pronto para a vistoria.",
    side: "você",
  },
  {
    icon: Paintbrush,
    title: "Restauração Completa",
    description: "Em 5 a 10 dias úteis, profissionais homologados deixam o imóvel idêntico ao seu Laudo de Vistoria Inicial. Você nem precisa pisar lá para acompanhar obra.",
    side: "entrega facilitada",
    divider: true,
  },
  {
    icon: Key,
    title: "Chave Entregue (Nada Consta)",
    description: "Vistoria da imobiliária aprovada. E se o fiscal for rigoroso e exigir qualquer retoque do que foi contratado, nós voltamos e resolvemos rápido. Sem te cobrar nada a mais.",
    side: "entrega facilitada",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-16 bg-muted/50" id="passo-a-passo">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-foreground mb-4">
            Como funciona
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Da contratação à desocupação descomplicada — veja cada etapa.
          </p>
        </motion.div>

        <div className="relative max-w-2xl mx-auto">
          {/* Vertical line */}
          <div className="absolute left-6 md:left-8 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-0">
            {steps.map((step, i) => (
              <div key={i}>
                {step.divider && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="relative flex items-center py-6 pl-[60px] md:pl-[76px]"
                  >
                    <div className="absolute left-[18px] md:left-[26px] w-4 h-4 rounded-full bg-secondary border-4 border-background z-10" />
                    <span className="text-xs font-bold uppercase tracking-widest text-secondary">
                      Daqui em diante é com a Entrega Facilitada ↓
                    </span>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="relative flex items-start gap-5 py-6"
                >
                  {/* Icon node */}
                  <div className="relative z-10 shrink-0">
                    <div
                      className={`flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-2xl shadow-[var(--shadow-soft)] ${step.side === "entrega facilitada"
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-primary text-primary-foreground"
                        }`}
                    >
                      <step.icon className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                      Etapa {i + 1}
                    </span>
                    <h3 className="text-lg font-heading font-bold text-foreground mb-1">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

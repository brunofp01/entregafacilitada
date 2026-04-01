import { motion } from "framer-motion";
import { FileText, CreditCard, CalendarCheck, ClipboardCheck, Paintbrush, Key } from "lucide-react";

const steps = [
  {
    icon: FileText,
    title: "Cadastro do contrato",
    description: "Insira os dados do imóvel ou conecte-se pela imobiliária. Simulamos o valor do pacote em segundos.",
    side: "você",
  },
  {
    icon: CreditCard,
    title: "Ativação do pacote",
    description: "Escolha o plano ideal e comece a pagar uma parcela mensal fixa, integrada ao aluguel. Sem surpresas.",
    side: "você",
  },
  {
    icon: CalendarCheck,
    title: "Solicite a desocupação",
    description: "Ao final do contrato, acione o app e agende a vistoria de saída de forma 100% digital.",
    side: "você",
  },
  {
    icon: ClipboardCheck,
    title: "Vistoria e diagnóstico",
    description: "Nossa equipe realiza a vistoria, documenta o estado do imóvel e gera o orçamento dos reparos cobertos.",
    side: "entrega facilitada",
    divider: true,
  },
  {
    icon: Paintbrush,
    title: "Execução dos reparos",
    description: "Profissionais credenciados cuidam de pintura, limpeza e reparos — tudo dentro do pacote contratado.",
    side: "entrega facilitada",
  },
  {
    icon: Key,
    title: "Chaves entregues, Nada Consta emitido",
    description: "Certificado automático de quitação. Entregue as chaves sem estresse e sem cobranças extras.",
    side: "entrega facilitada",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 bg-muted/50" id="como-funciona">
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
                      className={`flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-2xl shadow-[var(--shadow-soft)] ${
                        step.side === "entrega facilitada"
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

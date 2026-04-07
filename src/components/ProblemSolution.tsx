import { motion } from "framer-motion";
import { X, Check, AlertTriangle, TrendingDown, Scale } from "lucide-react";

const problems = [
  { icon: AlertTriangle, text: "Orçamentos abusivos de R$ 3.000 a R$ 8.000 na hora de sair do imóvel" },
  { icon: TrendingDown, text: "Descapitalização total: frete, novo caução e ainda ter que pagar a pintura" },
  { icon: Scale, text: "Ansiedade e atritos com a imobiliária por causa de detalhes da vistoria" },
];

const solutions = [
  "Pintura completa e pequenos reparos diluídos em parcelas mensais",
  "Equipe própria que assume a obra baseada no Laudo de Vistoria Inicial",
  "Garantia de aprovação: se a imobiliária exigir retoques, nós voltamos sem custo",
];

const ProblemSolution = () => {
  return (
    <section className="pt-10 pb-16 bg-background scroll-mt-20" id="como-funciona">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-foreground mb-4">
            Do problema à <span className="text-secondary">solução</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Entenda por que milhares de inquilinos já estão migrando para o modelo de desocupação facilitada.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Problem */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <X className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="text-xl font-heading font-bold text-foreground">Sem Entrega Facilitada</h3>
            </div>
            <div className="space-y-5">
              {problems.map((p, i) => (
                <div key={i} className="flex items-start gap-3">
                  <p.icon className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-foreground/80">{p.text}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Solution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-success/20 bg-success/5 p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <Check className="w-5 h-5 text-success" />
              </div>
              <h3 className="text-xl font-heading font-bold text-foreground">Com Entrega Facilitada</h3>
            </div>
            <div className="space-y-5">
              {solutions.map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <p className="text-foreground/80">{s}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;

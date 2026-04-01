import { motion } from "framer-motion";
import { UserX, DollarSign, Clock, Building2, Wrench, Home, ShieldCheck, Smile, TrendingUp, Handshake } from "lucide-react";

const audiences = [
  {
    id: "inquilino",
    label: "Para o Inquilino",
    pain: {
      title: "A dor de quem sai",
      items: [
        { icon: UserX, text: "Estresse da mudança somado a gastos inesperados com reparos" },
        { icon: DollarSign, text: "Medo de orçamentos abusivos e profissionais desconhecidos" },
        { icon: Clock, text: "Sem tempo nem experiência para coordenar obras de última hora" },
      ],
    },
    benefits: [
      { icon: ShieldCheck, text: "Zero surpresa: parcela fixa mensal, sem cobrança extra na saída" },
      { icon: Smile, text: "Profissionais credenciados cuidam de tudo por você" },
      { icon: Handshake, text: "Certificado de quitação automático — chaves entregues sem estresse" },
    ],
  },
  {
    id: "imobiliaria",
    label: "Para a Imobiliária",
    pain: {
      title: "O gargalo operacional",
      items: [
        { icon: Clock, text: "Imóvel parado esperando reparo não gera taxa de administração" },
        { icon: UserX, text: "Desgaste com proprietário e tempo gasto intermediando prestadores" },
        { icon: DollarSign, text: "Disputas e inadimplência no momento da rescisão contratual" },
      ],
    },
    benefits: [
      { icon: TrendingUp, text: "Desocupação ágil: imóvel volta ao mercado mais rápido" },
      { icon: Handshake, text: "Relacionamento preservado com inquilino e proprietário" },
      { icon: ShieldCheck, text: "Processo padronizado e documentado do início ao fim" },
    ],
  },
  {
    id: "proprietario",
    label: "Para o Proprietário",
    pain: {
      title: "A preocupação com o patrimônio",
      items: [
        { icon: Home, text: "Receio de receber o imóvel danificado e sem reparo" },
        { icon: Clock, text: "Demora na devolução = meses sem receita de aluguel" },
        { icon: Wrench, text: "Custo e trabalho para restaurar o imóvel por conta própria" },
      ],
    },
    benefits: [
      { icon: ShieldCheck, text: "Garantia de devolução com pintura e reparos em dia" },
      { icon: TrendingUp, text: "Imóvel pronto para relocar imediatamente" },
      { icon: Building2, text: "Relatórios visuais de vistoria de entrada e saída" },
    ],
  },
];

const UserProfiles = () => {
  return (
    <section className="py-24 bg-muted/50" id="vantagens">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-foreground mb-4">
            Vantagens para <span className="text-secondary">todos</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Resolvemos as dores de cada lado — inquilino, imobiliária e proprietário.
          </p>
        </motion.div>

        <div className="space-y-12 max-w-5xl mx-auto">
          {audiences.map((audience, i) => (
            <motion.div
              key={audience.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]"
            >
              <h3 className="text-xl font-heading font-bold text-foreground mb-6">
                {audience.label}
              </h3>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Pain */}
                <div>
                  <p className="text-sm font-semibold text-destructive mb-4 uppercase tracking-wider">
                    {audience.pain.title}
                  </p>
                  <ul className="space-y-3">
                    {audience.pain.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                          <item.icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm text-muted-foreground leading-relaxed">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Benefits */}
                <div>
                  <p className="text-sm font-semibold text-secondary mb-4 uppercase tracking-wider">
                    Com a Entrega Facilitada
                  </p>
                  <ul className="space-y-3">
                    {audience.benefits.map((item, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                          <item.icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm text-muted-foreground leading-relaxed">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UserProfiles;

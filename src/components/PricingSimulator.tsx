import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Calculator } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const PricingSimulator = () => {
  const [area, setArea] = useState(60);
  const [standard, setStandard] = useState<"normal" | "alto">("normal");
  const [months, setMonths] = useState<12 | 24>(12);
  const [params, setParams] = useState<Record<string, number>>({
    multiplier_ms: 0.15,
    coefficient_co: 0.08,
    sqm_cost_normal: 45,
    sqm_cost_alto: 90,
  });

  useEffect(() => {
    const loadParams = async () => {
      const { data } = await supabase.from("pricing_parameters").select("key, value");
      if (data) {
        const p: Record<string, number> = {};
        data.forEach(item => p[item.key] = item.value);
        setParams(prev => ({ ...prev, ...p }));
      }
    };
    loadParams();
  }, []);

  const result = useMemo(() => {
    const costKey = `sqm_cost_${standard === "normal" ? "medio" : "alto"}`;
    const costPerSqm = params[costKey] || (standard === "normal" ? 55 : 90);

    const Pp = area * costPerSqm;
    const Pc = (Pp * (1 + params.multiplier_ms)) / (1 - params.coefficient_co);
    const monthly = Pc / months;
    return { monthly };
  }, [area, standard, months, params]);

  return (
    <section className="py-24 bg-background" id="simulador">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-foreground mb-4">
            Simular minha <span className="text-secondary">Entrega Facilitada</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Mude de casa sem sustos. Escolha o tamanho do imóvel e o padrão de acabamento.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="grid md:grid-cols-5 gap-8">
            {/* Controls */}
            <div className="md:col-span-3 rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-3 mb-8">
                <Calculator className="w-5 h-5 text-secondary" />
                <h3 className="font-heading font-bold text-lg text-foreground">Configuração da Assinatura</h3>
              </div>

              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-foreground uppercase tracking-wider">Área útil do imóvel</label>
                    <span className="text-xl font-black text-secondary">{area} m²</span>
                  </div>
                  <Slider
                    value={[area]}
                    onValueChange={(v) => setArea(v[0])}
                    min={20}
                    max={300}
                    step={1}
                    className="[&_[role=slider]]:bg-secondary [&_[role=slider]]:border-secondary [&_.relative>div]:bg-secondary"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-muted-foreground">20 m²</span>
                    <span className="text-xs text-muted-foreground">300 m²</span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-3 block uppercase tracking-wider">Padrão do Imóvel</label>
                    <Select value={standard} onValueChange={(v) => setStandard(v as typeof standard)}>
                      <SelectTrigger className="h-12 border-border/60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Padrão Normal</SelectItem>
                        <SelectItem value="alto">Alto Padrão</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-3 block uppercase tracking-wider">Prazo de Pagamento</label>
                    <div className="grid grid-cols-2 gap-2 bg-muted p-1 rounded-lg h-12">
                      <button
                        onClick={() => setMonths(12)}
                        className={`text-sm font-bold rounded-md transition-all ${months === 12 ? 'bg-white shadow-sm text-secondary' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        12 Meses
                      </button>
                      <button
                        onClick={() => setMonths(24)}
                        className={`text-sm font-bold rounded-md transition-all ${months === 24 ? 'bg-white shadow-sm text-secondary' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        24 Meses
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Result */}
            <div className="md:col-span-2 flex flex-col">
              <div className="rounded-2xl p-8 text-primary-foreground flex-1 flex flex-col items-center justify-center text-center shadow-xl transform transition-transform hover:scale-[1.02]" style={{ background: "var(--gradient-hero)" }}>
                <p className="text-primary-foreground/60 text-sm uppercase tracking-widest mb-4">Sua parcela mensal</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl font-bold opacity-70">R$</span>
                  <span className="text-6xl md:text-7xl font-heading font-black">
                    {result.monthly.toFixed(0)}
                  </span>
                </div>
                <p className="text-primary-foreground/80 font-medium text-sm border-t border-white/10 pt-4 w-full">
                  Pagamento recorrente em {months}x no cartão
                </p>
                <div className="mt-8 w-full">
                  <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 h-14 text-lg font-black uppercase tracking-tight shadow-lg shadow-secondary/20">
                    Contratar agora
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSimulator;

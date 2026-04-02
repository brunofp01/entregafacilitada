import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Calculator } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PricingSimulator = () => {
  const [area, setArea] = useState(60);
  const [standard, setStandard] = useState<"basico" | "medio" | "alto">("medio");
  const [params, setParams] = useState<Record<string, number>>({
    months: 12,
    multiplier_ms: 0.15,
    coefficient_co: 0.08,
    sqm_cost_basico: 35,
    sqm_cost_medio: 55,
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
    const costKey = `sqm_cost_${standard}`;
    const costPerSqm = params[costKey] || 55;

    const Pp = area * costPerSqm;
    const Pc = (Pp * (1 + params.multiplier_ms)) / (1 - params.coefficient_co);
    const monthly = Pc / params.months;
    return { monthly };
  }, [area, standard, params]);

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
            Simule seu <span className="text-secondary">pacote</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Descubra quanto custa proteger sua desocupação com base no seu imóvel.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <div className="grid md:grid-cols-5 gap-8">
            {/* Controls */}
            <div className="md:col-span-3 rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-3 mb-8">
                <Calculator className="w-5 h-5 text-secondary" />
                <h3 className="font-heading font-bold text-lg text-foreground">Dados do imóvel</h3>
              </div>

              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-foreground">Área do imóvel</label>
                    <span className="text-sm font-bold text-secondary">{area} m²</span>
                  </div>
                  <Slider
                    value={[area]}
                    onValueChange={(v) => setArea(v[0])}
                    min={20}
                    max={300}
                    step={5}
                    className="[&_[role=slider]]:bg-secondary [&_[role=slider]]:border-secondary [&_.relative>div]:bg-secondary"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-muted-foreground">20 m²</span>
                    <span className="text-xs text-muted-foreground">300 m²</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">Padrão de acabamento</label>
                  <Select value={standard} onValueChange={(v) => setStandard(v as typeof standard)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basico">Básico — Pintura simples, piso cerâmico</SelectItem>
                      <SelectItem value="medio">Médio — Pintura acrílica, porcelanato</SelectItem>
                      <SelectItem value="alto">Alto padrão — Texturas, acabamento premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Result */}
            <div className="md:col-span-2 flex flex-col">
              <div className="rounded-2xl p-8 text-primary-foreground flex-1 flex flex-col items-center justify-center text-center" style={{ background: "var(--gradient-hero)" }}>
                <p className="text-primary-foreground/60 text-sm uppercase tracking-wider mb-2">Sua parcela mensal</p>
                <p className="text-5xl md:text-6xl font-heading font-extrabold mb-1">
                  R$ {result.monthly.toFixed(0)}
                </p>
                <p className="text-primary-foreground/50 text-sm">/mês por 12 meses</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSimulator;

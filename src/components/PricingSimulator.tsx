import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Calculator } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { calcPp, calcPc, sumActive, FormulaParam } from "@/lib/pricingCalc";

const PricingSimulator = () => {
  const [area, setArea] = useState(60);
  const [config, setConfig] = useState<{
    ms_params: FormulaParam[];
    co_params: FormulaParam[];
    plans: any[];
  } | null>(null);
  const [compositionItems, setCompositionItems] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      // 1. Load Global Config
      const { data: configData } = await supabase.from("pricing_parameters_config").select("*").eq("id", 1).single();
      if (configData) setConfig(configData);

      // 2. Load Composition Items for real-time recalculation
      const { data: itemsData } = await supabase.from("cost_composition_items").select("*");
      if (itemsData) setCompositionItems(itemsData);
    };
    loadData();
  }, []);

  const result = useMemo(() => {
    if (!config) return { monthly: 0 };

    // Use the basic plan as requested by the user
    const basicPlan = config.plans.find(p => p.id === "basico");
    if (!basicPlan) return { monthly: 0 };

    // Calculate dynamic composition costs like the admin does
    let dynamicBasicoMat = 0;
    let dynamicBasicoLabor = 0;

    compositionItems.forEach(item => {
      if (item.in_basico) {
        const indice = item.indice_sinapi || 0;
        const prob = item.probabilidade || 0;
        const rend = item.rendimento || 1;
        const ref = item.valor_referencia || 0;

        const totalServico = area * indice;
        const execucaoPrevista = totalServico * (prob / 100);

        let mo = rend > 0 ? (execucaoPrevista / rend) * ref * 0.57 : 0;
        let mat = rend > 0 ? (execucaoPrevista / rend) * ref * 0.43 : 0;

        if (item.tem_valor_minimo) {
          const minV = item.valor_minimo || 0;
          if ((mo + mat) < minV) {
            mo = minV * 0.57;
            mat = minV * 0.43;
          }
        }
        dynamicBasicoMat += mat;
        dynamicBasicoLabor += mo;
      }
    });

    // Update the basic plan params with our recalculated values
    const updatedParams = basicPlan.params.map((p: any) => {
      if (p.id === "pb1") return { ...p, value: dynamicBasicoMat.toString() };
      if (p.id === "pb2") return { ...p, value: dynamicBasicoLabor.toString() };
      return p;
    });

    const totalMs = sumActive(config.ms_params);
    const totalCo = sumActive(config.co_params);
    const pp = calcPp(updatedParams, area);
    const pc = calcPc(pp, totalMs, totalCo);
    const monthly = pc / 24; // Always 24x as requested

    return { monthly };
  }, [area, config, compositionItems]);

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
            Mude de casa sem sustos. Simule seu plano de desocupação facilitada em segundos.
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

                <div className="p-4 bg-muted/50 rounded-xl border border-border/40">
                  <p className="text-sm font-medium text-foreground uppercase tracking-widest mb-1">Plano Selecionado</p>
                  <p className="text-lg font-black text-secondary">Plano Básico</p>
                  <p className="text-xs text-muted-foreground mt-1">Inclui pintura completa de saída e pequenos reparos estéticos.</p>
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
                  Pagamento recorrente em 24x no cartão
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

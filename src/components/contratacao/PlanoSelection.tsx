import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";
import { PLAN_ITEMS } from "@/constants/planItems";
import { calcPc, calcPp, sumActive, calculateCompositionTotals } from "@/lib/pricingCalc";

interface PlanoSelectionProps {
    area: string;
    parametrosGlobais: any;
    compositionItems: any[];
    parcelas: number;
    onParcelasChange: (p: number) => void;
}

export const PlanoSelection = ({
    area,
    parametrosGlobais,
    compositionItems,
    parcelas,
    onParcelasChange
}: PlanoSelectionProps) => {
    const areaNumber = parseFloat(area) || 0;

    return (
        <Card className={`border-secondary/30 bg-secondary/5 backdrop-blur-sm transition-all duration-500 shadow-xl ${!area || areaNumber <= 0 ? 'opacity-60 saturate-50' : 'scale-[1.01]'}`}>
            <CardHeader className="pb-4 border-b border-secondary/20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground shadow-lg flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <CardTitle>Plano Entrega Facilitada</CardTitle>
                        <CardDescription>O valor do plano é ajustado automaticamente baseado na metragem do imóvel.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                {!area || areaNumber <= 0 ? (
                    <div className="text-center py-6">
                        <p className="text-muted-foreground font-semibold">Insira primeiramente a <span className="text-secondary uppercase">Metragem (m²)</span> do imóvel acima para gerar o valor da proteção.</p>
                    </div>
                ) : !parametrosGlobais ? (
                    <div className="flex items-center justify-center py-6 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Calculando cotação em tempo real...</div>
                ) : (
                    <div className="max-w-2xl mx-auto">
                        {parametrosGlobais.plans?.filter((p: any) => p.id === 'basico').map((plan: any) => {
                            const { material, labor } = calculateCompositionTotals(compositionItems, areaNumber, plan.id);
                            const uParams = (plan.params || []).map((p: any) => {
                                if (p.id === 'pb1' || p.id === 'pc1') return { ...p, value: material.toFixed(2) };
                                if (p.id === 'pb2' || p.id === 'pc2') return { ...p, value: labor.toFixed(2) };
                                return p;
                            });
                            
                            const pc = calcPc(calcPp(uParams, areaNumber), sumActive(parametrosGlobais.ms_params), sumActive(parametrosGlobais.co_params));
                            const valorParcela = pc / parcelas;

                            return (
                                <div key={plan.id} className="relative rounded-2xl border-2 border-secondary bg-white p-8 transition-all duration-300 shadow-lg text-center">
                                    <div className="absolute top-0 right-0 bg-secondary text-white px-4 py-1 text-xs font-bold rounded-bl-xl shadow-md">
                                        Plano de Proteção Ativo
                                    </div>

                                    <div className="mb-6">
                                        <div className="text-sm font-black uppercase tracking-widest text-secondary mb-2">Plano Entrega Facilitada</div>
                                        <div className="text-4xl md:text-5xl font-extrabold tracking-tighter text-foreground flex items-baseline justify-center gap-1">
                                            <span className="text-xl font-bold">{parcelas}x</span>
                                            <span className="text-xl font-bold ml-1">R$</span>
                                            {valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </div>

                                    <div className="flex justify-center gap-3 mb-8">
                                        <Button
                                            type="button"
                                            variant={parcelas === 12 ? "default" : "outline"}
                                            onClick={() => onParcelasChange(12)}
                                            className={`h-10 px-6 rounded-full font-bold ${parcelas === 12 ? 'bg-secondary text-secondary-foreground' : ''}`}
                                        >
                                            12 Meses
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={parcelas === 24 ? "default" : "outline"}
                                            onClick={() => onParcelasChange(24)}
                                            className={`h-10 px-6 rounded-full font-bold ${parcelas === 24 ? 'bg-secondary text-secondary-foreground' : ''}`}
                                        >
                                            24 Meses
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                                        {PLAN_ITEMS.map((item, index) => (
                                            <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/5 border border-secondary/10">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                <span className="text-xs font-bold text-foreground/80 leading-tight">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

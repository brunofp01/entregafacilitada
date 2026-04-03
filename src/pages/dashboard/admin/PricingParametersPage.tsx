import { useState, useCallback, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
    Save, Info, Calculator, Settings2,
    Zap, Star, Globe,
    Percent, DollarSign, TrendingUp, Shield,
    Plus, Trash2, PlayCircle, Ruler, CalendarDays, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { CostCompositionSubpage } from "./CostCompositionSubpage";
import { supabase } from "@/lib/supabaseClient";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormulaParam {
    id: string;
    label: string;
    value: string;
    unit: "percent" | "currency" | "number";
    active: boolean;
    removable?: boolean;
    readonly?: boolean;
}

const uid = () => Math.random().toString(36).slice(2, 8);

const makeNew = (unit: FormulaParam["unit"] = "percent"): FormulaParam => ({
    id: uid(), label: "Nova despesa", value: "0", unit, active: true, removable: true,
});

// ─── Dados Iniciais ──────────────────────────────────────────────────────────

const ppBasico: FormulaParam[] = [
    { id: "pb1", label: "Custo de Material (Composição)", value: "0", unit: "currency", active: true, readonly: true },
    { id: "pb2", label: "Custo de Mão de Obra (Composição)", value: "0", unit: "currency", active: true, readonly: true },
    { id: "pb3", label: "Projeção INCC Acumulado", value: "8", unit: "percent", active: true },
];

const ppCompleto: FormulaParam[] = [
    { id: "pm1", label: "Custo de Material (Composição)", value: "0", unit: "currency", active: true, readonly: true },
    { id: "pm2", label: "Custo de Mão de Obra (Composição)", value: "0", unit: "currency", active: true, readonly: true },
    { id: "pm3", label: "Projeção INCC Acumulado", value: "10", unit: "percent", active: true },
];

const initialMs: FormulaParam[] = [
    { id: "ms1", label: "Margem de Lucro Esperado", value: "15", unit: "percent", active: true },
    { id: "ms2", label: "Fator de Risco Moral", value: "5", unit: "percent", active: true },
    { id: "ms3", label: "Taxa de Inadimplência Estimada", value: "3", unit: "percent", active: true },
];

const initialCo: FormulaParam[] = [
    { id: "co1", label: "Impostos", value: "12", unit: "percent", active: true },
    { id: "co2", label: "Taxa do Gateway de Pagamento", value: "3.5", unit: "percent", active: true },
    { id: "co3", label: "Comissão da Imobiliária", value: "5", unit: "percent", active: true },
    { id: "co4", label: "Custo de Plataforma / Adm", value: "3", unit: "percent", active: true },
];

interface PlanConfig {
    id: string; label: string; color: string; bgColor: string; borderColor: string;
    icon: any; badge: string; params: FormulaParam[];
}

const initialPlans: PlanConfig[] = [
    {
        id: "basico", label: "Plano Básico", color: "text-blue-500",
        bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20",
        icon: Zap, badge: "Entrada", params: ppBasico
    },
    {
        id: "completo", label: "Plano Completo", color: "text-secondary",
        bgColor: "bg-secondary/10", borderColor: "border-secondary/20",
        icon: Star, badge: "Recomendado", params: ppCompleto
    },
];

// ─── Cálculo ──────────────────────────────────────────────────────────────────
const isPerSqm = (label: string) => label.toLowerCase().includes("m²");

const calcPp = (params: FormulaParam[], area: number) => {
    let base = 0; let pct = 0;
    params.filter(p => p.active).forEach(p => {
        const v = parseFloat(p.value) || 0;
        if (p.unit === "currency") base += isPerSqm(p.label) ? v * area : v;
        else if (p.unit === "percent") pct += v;
    });
    return base * (1 + pct / 100);
};

const calcPc = (pp: number, msTotal: number, coTotal: number) => {
    const d = 1 - coTotal / 100;
    return d > 0 ? (pp * (1 + msTotal / 100)) / d : 0;
};

const sumActive = (params: FormulaParam[]) =>
    params.filter(p => p.active).reduce((s, p) => s + (parseFloat(p.value) || 0), 0);

// ─── Toggle Switch ─────────────────────────────────────────────────────────────
const ToggleSwitch = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => (
    <button
        onClick={onToggle}
        title={active ? "Desativar do cálculo" : "Ativar no cálculo"}
        className={`relative shrink-0 w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${active ? "bg-secondary" : "bg-muted-foreground/30"
            }`}
    >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${active ? "translate-x-4" : "translate-x-0"
            }`} />
    </button>
);

// ─── ParamRow ─────────────────────────────────────────────────────────────────
const ParamRow = ({
    param, onUpdate, onRemove, onToggle,
}: {
    param: FormulaParam;
    onUpdate: (id: string, field: "label" | "value" | "unit", v: string) => void;
    onRemove?: (id: string) => void;
    onToggle: (id: string) => void;
}) => (
    <div className={`group flex items-center gap-2 py-2.5 border-b border-border/30 last:border-0 transition-opacity ${param.active ? "opacity-100" : "opacity-40"
        }`}>
        <ToggleSwitch active={param.active} onToggle={() => onToggle(param.id)} />
        <div className="flex-1 min-w-0">
            <input
                type="text"
                value={param.label}
                onChange={e => onUpdate(param.id, "label", e.target.value)}
                disabled={!param.active || param.readonly}
                className="bg-transparent border-0 focus:outline-none text-sm font-medium text-foreground w-full placeholder:text-muted-foreground disabled:cursor-not-allowed"
                placeholder="Nome da despesa"
            />
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
            <select
                value={param.unit}
                onChange={e => onUpdate(param.id, "unit", e.target.value)}
                disabled={!param.active || param.readonly}
                className="text-[10px] bg-muted/50 border border-border/40 rounded px-1 py-1 text-muted-foreground cursor-pointer disabled:cursor-not-allowed"
            >
                <option value="currency">R$</option>
                <option value="percent">%</option>
                <option value="number">nº</option>
            </select>
            <div className="relative w-24">
                {param.unit === "currency" && <DollarSign className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />}
                {param.unit === "percent" && <Percent className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />}
                <Input
                    type="number" step="0.01" value={param.value}
                    disabled={!param.active || param.readonly}
                    onChange={e => onUpdate(param.id, "value", e.target.value)}
                    className={`${param.unit !== "number" ? "pl-6" : ""} bg-background/60 border-border/50 font-mono text-sm h-8 focus:border-secondary/50 disabled:cursor-not-allowed`}
                />
            </div>
            {param.removable && onRemove && (
                <button onClick={() => onRemove(param.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 rounded">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    </div>
);

// ─── Componente Principal ─────────────────────────────────────────────────────
const PricingParametersPage = () => {
    const [msParams, setMsParams] = useState<FormulaParam[]>(initialMs);
    const [coParams, setCoParams] = useState<FormulaParam[]>(initialCo);
    const [plans, setPlans] = useState<PlanConfig[]>(initialPlans);
    const [installments, setInstallments] = useState(24);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [simPlan, setSimPlan] = useState("basico");
    const [simArea, setSimArea] = useState(60);

    useEffect(() => {
        const loadGlobals = async () => {
            const { data, error } = await supabase.from('pricing_parameters_config').select('*').eq('id', 1).single();
            if (data && !error) {
                if (data.ms_params?.length) setMsParams(data.ms_params);
                if (data.co_params?.length) setCoParams(data.co_params);
                if (data.plans?.length) {
                    const restoredPlans = data.plans.map((dbPlan: any) => {
                        const orig = initialPlans.find(p => p.id === dbPlan.id);
                        return {
                            ...dbPlan,
                            icon: orig?.icon // Restaura os componentes React que o JSON ignorou
                        };
                    });
                    setPlans(restoredPlans);
                }
                if (data.installments) setInstallments(data.installments);
            }
        };
        loadGlobals();
    }, []);

    const handleSaveGlobalParams = async () => {
        setIsSaving(true);
        const { error } = await supabase.from('pricing_parameters_config').upsert({
            id: 1,
            ms_params: msParams,
            co_params: coParams,
            plans: plans,
            installments: installments,
            updated_at: new Date().toISOString()
        });
        setIsSaving(false);
        if (error) {
            toast.error("Erro ao salvar parâmetros no banco de dados.");
            console.error(error);
        } else {
            toast.success("Parâmetros globais salvos com sucesso!");
            setIsDirty(false);
        }
    };

    const handleCompositionTotalsUpdate = useCallback((basicoMat: number, basicoLabor: number, completoMat: number, completoLabor: number) => {
        const bMatStr = basicoMat.toFixed(2);
        const bLabStr = basicoLabor.toFixed(2);
        const cMatStr = completoMat.toFixed(2);
        const cLabStr = completoLabor.toFixed(2);

        setPlans(ps => ps.map(pl => {
            if (pl.id === "basico") {
                let changed = false;
                const newParams = pl.params.map(p => {
                    if (p.id === "pb1" && p.value !== bMatStr) { changed = true; return { ...p, value: bMatStr }; }
                    if (p.id === "pb2" && p.value !== bLabStr) { changed = true; return { ...p, value: bLabStr }; }
                    return p;
                });
                return changed ? { ...pl, params: newParams } : pl;
            }
            if (pl.id === "completo") {
                let changed = false;
                const newParams = pl.params.map(p => {
                    if (p.id === "pm1" && p.value !== cMatStr) { changed = true; return { ...p, value: cMatStr }; }
                    if (p.id === "pm2" && p.value !== cLabStr) { changed = true; return { ...p, value: cLabStr }; }
                    return p;
                });
                return changed ? { ...pl, params: newParams } : pl;
            }
            return pl;
        }));
    }, []);

    const touch = () => setIsDirty(true);

    // ── Shared ──────────────────────────────────────────────────────────────
    const updateShared = (setter: any, id: string, field: any, v: string) => {
        setter((ps: FormulaParam[]) => ps.map((p: FormulaParam) => p.id === id ? { ...p, [field]: v } : p));
        touch();
    };
    const toggleShared = (setter: any, id: string) => {
        setter((ps: FormulaParam[]) => ps.map((p: FormulaParam) => p.id === id ? { ...p, active: !p.active } : p));
        touch();
    };
    const removeShared = (setter: any, id: string) => {
        setter((ps: FormulaParam[]) => ps.filter((p: FormulaParam) => p.id !== id));
        touch();
    };
    const addShared = (setter: any, unit: FormulaParam["unit"] = "percent") => {
        setter((ps: FormulaParam[]) => [...ps, makeNew(unit)]);
        touch();
    };

    // ── Totals ───────────────────────────────────────────────────────────────
    const totalMs = sumActive(msParams);
    const totalCo = sumActive(coParams);
    const planPcs = plans.map(pl => {
        const pp = calcPp(pl.params, simArea);
        const pc = calcPc(pp, totalMs, totalCo);
        const monthly = installments > 0 ? pc / installments : 0;
        return { ...pl, pp, pc, monthly };
    });
    const simData = planPcs.find(p => p.id === simPlan);

    // ── Plan ────────────────────────────────────────────────────────────────
    const updatePlan = (planId: string, id: string, field: any, v: string) => {
        setPlans(ps => ps.map(pl => pl.id === planId
            ? { ...pl, params: pl.params.map(p => p.id === id ? { ...p, [field]: v } : p) }
            : pl));
        touch();
    };
    const togglePlan = (planId: string, id: string) => {
        setPlans(ps => ps.map(pl => pl.id === planId
            ? { ...pl, params: pl.params.map(p => p.id === id ? { ...p, active: !p.active } : p) }
            : pl));
        touch();
    };
    const removePlanParam = (planId: string, id: string) => {
        setPlans(ps => ps.map(pl => pl.id === planId
            ? { ...pl, params: pl.params.filter(p => p.id !== id) }
            : pl));
        touch();
    };
    const addPlanParam = (planId: string) => {
        setPlans(ps => ps.map(pl => pl.id === planId
            ? { ...pl, params: [...pl.params, makeNew("currency")] }
            : pl));
        touch();
    };

    return (
        <DashboardLayout role="admin">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">

                {/* ── Header ── */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">Parâmetros de Cálculo</h1>
                        <p className="text-muted-foreground">Ajuste os fatores da fórmula atuarial e simule o Pc de cada plano em tempo real.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleSaveGlobalParams}
                            disabled={!isDirty || isSaving}
                            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2 shadow-lg shadow-secondary/20 shrink-0"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isDirty ? "Salvar Alterações" : "Salvo no Banco"}
                        </Button>
                    </div>
                </header>

                {/* ══ SIMULADOR ══ */}
                <Card className="border-secondary/30 bg-gradient-to-br from-secondary/5 via-card to-card shadow-xl shadow-secondary/10">
                    <CardHeader className="border-b border-border/30 pb-4">
                        <div className="flex items-center gap-2">
                            <PlayCircle className="w-5 h-5 text-secondary" />
                            <CardTitle className="text-base">Simulador de Preços</CardTitle>
                            <Badge variant="outline" className="text-[10px] ml-1">Tempo Real</Badge>
                        </div>
                        <CardDescription>Selecione um plano e a área para ver o Pc calculado com os parâmetros ativos.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">

                        {/* Slider m² */}
                        <div className="mb-4 p-4 bg-background/50 rounded-xl border border-border/40">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Ruler className="w-4 h-4 text-secondary" />
                                    <label className="text-sm font-semibold text-foreground">Área do imóvel</label>
                                </div>
                                <span className="font-mono font-bold text-secondary text-lg">{simArea} m²</span>
                            </div>
                            <Slider
                                value={[simArea]}
                                onValueChange={v => setSimArea(v[0])}
                                min={20} max={300} step={5}
                                className="[&_[role=slider]]:bg-secondary [&_[role=slider]]:border-secondary [&_.relative>div]:bg-secondary"
                            />
                            <div className="flex justify-between mt-1">
                                <span className="text-xs text-muted-foreground">20 m²</span>
                                <span className="text-xs text-muted-foreground">300 m²</span>
                            </div>
                        </div>

                        {/* Seletor de plano */}
                        <div className="flex flex-wrap gap-3 mb-6">
                            {plans.map(plan => {
                                const PIcon = plan.icon;
                                return (
                                    <button key={plan.id} onClick={() => setSimPlan(plan.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-sm transition-all ${simPlan === plan.id
                                            ? `${plan.bgColor} ${plan.color} ${plan.borderColor} shadow-md scale-105`
                                            : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60"
                                            }`}>
                                        <PIcon className="w-4 h-4" /> {plan.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Cards de resultado */}
                        {simData && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center p-5 rounded-2xl bg-background/70 border border-border/50 gap-1">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Pp (base)</span>
                                    <span className="font-mono font-extrabold text-xl">R$ {simData.pp.toFixed(2)}</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 gap-1">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Ms</span>
                                    <span className="font-mono font-extrabold text-xl text-emerald-500">{totalMs.toFixed(1)}%</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 gap-1">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Co</span>
                                    <span className="font-mono font-extrabold text-xl text-rose-500">{totalCo.toFixed(1)}%</span>
                                </div>
                                <div className={`flex flex-col items-center justify-center p-5 rounded-2xl border gap-1 ${plans.find(p => p.id === simPlan)?.bgColor} ${plans.find(p => p.id === simPlan)?.borderColor}`}>
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Pc Final</span>
                                    <span className={`font-mono font-extrabold text-2xl ${plans.find(p => p.id === simPlan)?.color}`}>
                                        R$ {simData.pc.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Comparativo */}
                        <div className="mt-6 pt-5 border-t border-border/30">
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-3">Comparativo de Planos</p>
                            <div className="flex flex-col sm:flex-row gap-3 mb-3">
                                {planPcs.map(plan => {
                                    const PIcon = plan.icon;
                                    return (
                                        <div key={plan.id} className="flex-1 flex items-center justify-between sm:flex-col sm:items-center p-3 rounded-xl bg-background/50 border border-border/40 gap-1">
                                            <div className={`flex items-center gap-1.5 ${plan.color}`}>
                                                <PIcon className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold">{plan.label}</span>
                                            </div>
                                            <div className="text-center">
                                                <div className="font-mono font-extrabold text-base text-foreground">R$ {plan.pc.toFixed(2)}</div>
                                                <div className="text-[10px] text-muted-foreground">valor total</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                {planPcs.map(plan => (
                                    <div key={plan.id} className={`flex-1 flex items-center justify-between sm:flex-col sm:items-center p-3 rounded-xl border gap-1 ${plan.bgColor} ${plan.borderColor}`}>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{installments}x de</span>
                                        <span className={`font-mono font-extrabold text-lg ${plan.color}`}>R$ {plan.monthly.toFixed(2)}</span>
                                        <span className="text-[10px] text-muted-foreground">/mês</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ══ PARÂMETROS COMUNS ══ */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Globe className="w-5 h-5 text-muted-foreground" />
                        <h2 className="text-lg font-bold text-foreground">Parâmetros Comuns a Todos os Planos</h2>
                    </div>

                    {/* Número de Parcelas */}
                    <div className="mb-6">
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-md">
                            <CardHeader className="pb-3 border-b border-border/30">
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="w-5 h-5 text-violet-500" />
                                    <CardTitle className="text-base">Número de Parcelas</CardTitle>
                                </div>
                                <CardDescription className="text-xs">
                                    Divide o Pc final por este número para calcular a mensalidade. Aplica-se a todos os planos.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-sm font-semibold text-foreground">Opções de Parcelamento</label>
                                            <span className="font-mono font-bold text-violet-500 text-lg">{installments}x</span>
                                        </div>
                                        <div className="flex items-center gap-3 w-full">
                                            <Button
                                                variant={installments === 12 ? "default" : "outline"}
                                                className={`flex-1 transition-all ${installments === 12 ? "bg-violet-500 hover:bg-violet-600 text-white shadow-md shadow-violet-500/20" : "border-border/50 hover:bg-black/5 dark:hover:bg-white/5"}`}
                                                onClick={() => { setInstallments(12); touch(); }}
                                            >
                                                12 Parcelas
                                            </Button>
                                            <Button
                                                variant={installments === 24 ? "default" : "outline"}
                                                className={`flex-1 transition-all ${installments === 24 ? "bg-violet-500 hover:bg-violet-600 text-white shadow-md shadow-violet-500/20" : "border-border/50 hover:bg-black/5 dark:hover:bg-white/5"}`}
                                                onClick={() => { setInstallments(24); touch(); }}
                                            >
                                                24 Parcelas
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Ms */}
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-md">
                            <CardHeader className="pb-2 border-b border-border/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                                        <CardTitle className="text-base">Margem de Segurança (Ms)</CardTitle>
                                    </div>
                                    <Badge className="font-mono bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{totalMs.toFixed(1)}%</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-2">
                                {msParams.map(p => (
                                    <ParamRow key={p.id} param={p}
                                        onUpdate={(id, field, v) => updateShared(setMsParams, id, field, v)}
                                        onToggle={(id) => toggleShared(setMsParams, id)}
                                        onRemove={p.removable ? (id) => removeShared(setMsParams, id) : undefined}
                                    />
                                ))}
                                <Button variant="ghost" size="sm"
                                    className="mt-3 w-full gap-2 border border-dashed border-border/50 text-muted-foreground hover:text-emerald-500 hover:border-emerald-500/40 hover:bg-emerald-500/5"
                                    onClick={() => addShared(setMsParams, "percent")}>
                                    <Plus className="w-4 h-4" /> Adicionar Item
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Co */}
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-md">
                            <CardHeader className="pb-2 border-b border-border/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-rose-500" />
                                        <CardTitle className="text-base">Custos Operacionais (Co)</CardTitle>
                                    </div>
                                    <Badge className="font-mono bg-rose-500/10 text-rose-500 border-rose-500/20">{totalCo.toFixed(1)}%</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-2">
                                {coParams.map(p => (
                                    <ParamRow key={p.id} param={p}
                                        onUpdate={(id, field, v) => updateShared(setCoParams, id, field, v)}
                                        onToggle={(id) => toggleShared(setCoParams, id)}
                                        onRemove={p.removable ? (id) => removeShared(setCoParams, id) : undefined}
                                    />
                                ))}
                                <Button variant="ghost" size="sm"
                                    className="mt-3 w-full gap-2 border border-dashed border-border/50 text-muted-foreground hover:text-rose-500 hover:border-rose-500/40 hover:bg-rose-500/5"
                                    onClick={() => addShared(setCoParams, "percent")}>
                                    <Plus className="w-4 h-4" /> Adicionar Item
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                {/* ══ POR PLANO (Pp) ══ */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Settings2 className="w-5 h-5 text-muted-foreground" />
                        <h2 className="text-lg font-bold text-foreground">Prêmio Puro por Plano — Pp</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        {plans.map(plan => {
                            const PlanIcon = plan.icon;
                            const pp = calcPp(plan.params, simArea);
                            const pc = calcPc(pp, totalMs, totalCo);
                            const monthly = installments > 0 ? pc / installments : 0;
                            return (
                                <Card key={plan.id} className={`border ${plan.borderColor} bg-card/60 backdrop-blur-sm shadow-md`}>
                                    <CardHeader className={`pb-3 border-b border-border/30 ${plan.bgColor}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className={`flex items-center gap-2 ${plan.color}`}>
                                                <PlanIcon className="w-5 h-5" />
                                                <CardTitle className="text-base">{plan.label}</CardTitle>
                                            </div>
                                            <Badge className={`text-[10px] font-bold ${plan.bgColor} ${plan.color} ${plan.borderColor}`}>{plan.badge}</Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-[11px] text-muted-foreground">Pc estimado</span>
                                                <div className={`font-mono font-extrabold text-xl ${plan.color}`}>R$ {pc.toFixed(2)}</div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[11px] text-muted-foreground">{installments}x de</span>
                                                <div className={`font-mono font-extrabold text-xl ${plan.color}`}>R$ {monthly.toFixed(2)}</div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-2">
                                        {plan.params.map(p => (
                                            <ParamRow key={p.id} param={p}
                                                onUpdate={(id, field, v) => updatePlan(plan.id, id, field, v)}
                                                onToggle={(id) => togglePlan(plan.id, id)}
                                                onRemove={p.removable ? (id) => removePlanParam(plan.id, id) : undefined}
                                            />
                                        ))}
                                        <Button variant="ghost" size="sm"
                                            className="mt-3 w-full gap-2 border border-dashed border-border/50 text-muted-foreground"
                                            onClick={() => addPlanParam(plan.id)}>
                                            <Plus className="w-4 h-4" /> Adicionar Item
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                <Separator />

                {/* ══ FÓRMULA ══ */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="border-b border-border/30 pb-4">
                        <div className="flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-secondary" />
                            <CardTitle className="text-base">Fórmula Atuarial de Referência</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-1">
                                <p className="font-mono font-extrabold text-3xl md:text-4xl text-foreground tracking-tight mb-4">
                                    P<sub className="text-lg">c</sub> = <span className="text-secondary">P<sub className="text-lg">p</sub> × (1 + M<sub className="text-lg">s</sub>)</span> / (1 − C<sub className="text-lg">o</sub>)
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    <strong className="text-foreground">Pc</strong> = Preço final &nbsp;|&nbsp;
                                    <strong className="text-foreground">Pp</strong> = Prêmio puro (custo base por plano) &nbsp;|&nbsp;
                                    <strong className="text-foreground">Ms</strong> = Margens de segurança &nbsp;|&nbsp;
                                    <strong className="text-foreground">Co</strong> = Custos operacionais
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    <strong className="text-violet-500">Mensalidade</strong> = Pc ÷ Número de Parcelas
                                </p>
                            </div>
                            <div className="grid grid-cols-3 gap-4 w-full md:w-auto md:min-w-[240px] shrink-0">
                                <div className="flex flex-col items-center p-3 bg-background/70 rounded-xl border border-border/50 gap-1">
                                    <span className="font-mono font-extrabold text-lg">Pp</span>
                                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest text-center">Por Plano</span>
                                </div>
                                <div className="flex flex-col items-center p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20 gap-1">
                                    <span className="font-mono font-extrabold text-lg text-emerald-500">{totalMs.toFixed(1)}%</span>
                                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest text-center">Ms Total</span>
                                </div>
                                <div className="flex flex-col items-center p-3 bg-rose-500/5 rounded-xl border border-rose-500/20 gap-1">
                                    <span className="font-mono font-extrabold text-lg text-rose-500">{totalCo.toFixed(1)}%</span>
                                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest text-center">Co Total</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl border border-border/40 text-sm text-muted-foreground">
                    <Info className="w-4 h-4 mt-0.5 shrink-0 text-secondary" />
                    <p>Estimativas calculadas em tempo real. Itens desativados (toggle desligado) são excluídos do cálculo. A persistência no Supabase será ativada na próxima fase.</p>
                </div>

                <Separator className="my-12 opacity-50" />

                <CostCompositionSubpage
                    area={simArea}
                    onTotalsChange={handleCompositionTotalsUpdate}
                />
            </div>
        </DashboardLayout>
    );
};

export default PricingParametersPage;

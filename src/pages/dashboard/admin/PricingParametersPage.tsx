import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Save,
    Info,
    Calculator,
    Settings2,
    Zap,
    Star,
    Crown,
    Globe,
    Percent,
    DollarSign,
    HelpCircle,
    TrendingUp,
    Shield,
    Plus,
    Trash2,
    PlayCircle,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormulaParam {
    id: string;
    key: string;
    label: string;
    symbol: string;
    value: string;
    description: string;
    unit: "percent" | "currency" | "number";
    hint?: string;
    removable?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 8);

const makeNewParam = (symbol: string, unit: FormulaParam["unit"] = "percent"): FormulaParam => ({
    id: uid(),
    key: `param_${uid()}`,
    label: "Nova despesa",
    symbol,
    value: "0",
    description: "Descreva este item",
    unit,
    hint: "Clique no campo para editar",
    removable: true,
});

// ─── Dados Iniciais ──────────────────────────────────────────────────────────

const initialSharedMs: FormulaParam[] = [
    {
        id: "ms1", key: "ms_administracao", label: "Despesas Administrativas", symbol: "Ms₁",
        value: "8", description: "Percentual que cobre custos de gestão, TI e equipe interna.", unit: "percent", hint: "Normalmente entre 5% e 15%"
    },
    {
        id: "ms2", key: "ms_inadimplencia", label: "Provisão para Inadimplência", symbol: "Ms₂",
        value: "3", description: "Margem de segurança para atrasos e inadimplências esperadas.", unit: "percent", hint: "Recomendado: 2% a 5%"
    },
    {
        id: "ms3", key: "ms_sinistralidade", label: "Provisão para Sinistros", symbol: "Ms₃",
        value: "4", description: "Reserva técnica para acionamentos e demandas imprevistas.", unit: "percent", hint: "Recomendado: 3% a 7%"
    },
];

const initialSharedCo: FormulaParam[] = [
    {
        id: "co1", key: "co_impostos", label: "Impostos e Tributação", symbol: "Co₁",
        value: "12", description: "Carga tributária total incidente sobre o faturamento.", unit: "percent", hint: "ISS + PIS + COFINS + CSLL"
    },
    {
        id: "co2", key: "co_comissao", label: "Comissão de Parceiros", symbol: "Co₂",
        value: "5", description: "Comissão paga às imobiliárias parceiras pelo serviço.", unit: "percent", hint: "Variável por contrato"
    },
    {
        id: "co3", key: "co_plataforma", label: "Custo de Operação da Plataforma", symbol: "Co₃",
        value: "3", description: "Manutenção da infraestrutura tecnológica.", unit: "percent", hint: "Revise semestralmente"
    },
];

interface PlanConfig {
    id: string;
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: any;
    badge: string;
    params: FormulaParam[];
}

const initialPlans: PlanConfig[] = [
    {
        id: "basico", label: "Plano Básico", color: "text-blue-500", bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/20", icon: Zap, badge: "Entrada",
        params: [
            { id: "pb1", key: "pp_basico_custo", label: "Custo Base do Serviço", symbol: "Pp₁", value: "120", description: "Custo mínimo para prestação do serviço.", unit: "currency", hint: "Custo real operacional da entrega" },
            { id: "pb2", key: "pp_basico_cobertura", label: "Cobertura de Garantia", symbol: "Pp₂", value: "15", description: "Percentual adicional para coberturas básicas.", unit: "percent", hint: "Coberturas do plano básico" },
        ]
    },
    {
        id: "medio", label: "Plano Médio", color: "text-secondary", bgColor: "bg-secondary/10",
        borderColor: "border-secondary/20", icon: Star, badge: "Recomendado",
        params: [
            { id: "pm1", key: "pp_medio_custo", label: "Custo Base do Serviço", symbol: "Pp₁", value: "180", description: "Custo operacional para o plano médio.", unit: "currency", hint: "Inclui serviços intermediários" },
            { id: "pm2", key: "pp_medio_cobertura", label: "Cobertura de Garantia", symbol: "Pp₂", value: "25", description: "Percentual adicional para coberturas ampliadas.", unit: "percent", hint: "Coberturas intermediárias" },
            { id: "pm3", key: "pp_medio_vistoria", label: "Módulo de Vistoria", symbol: "Pp₃", value: "30", description: "Custo adicional pelo módulo de vistoria incluso.", unit: "currency", hint: "Vistoria de entrada e saída" },
        ]
    },
    {
        id: "alto", label: "Plano Alto Padrão", color: "text-amber-500", bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/20", icon: Crown, badge: "Premium",
        params: [
            { id: "pa1", key: "pp_alto_custo", label: "Custo Base do Serviço", symbol: "Pp₁", value: "280", description: "Custo operacional para a entrega premium.", unit: "currency", hint: "Inclui todos os serviços" },
            { id: "pa2", key: "pp_alto_cobertura", label: "Cobertura de Garantia Premium", symbol: "Pp₂", value: "40", description: "Cobertura total com garantias ampliadas.", unit: "percent", hint: "Cobertura máxima disponível" },
            { id: "pa3", key: "pp_alto_vistoria", label: "Módulo de Vistoria Premium", symbol: "Pp₃", value: "50", description: "Vistoria detalhada com laudo técnico e fotos.", unit: "currency", hint: "Laudo técnico incluso" },
            { id: "pa4", key: "pp_alto_assessoria", label: "Assessoria Jurídica", symbol: "Pp₄", value: "45", description: "Suporte jurídico especializado.", unit: "currency", hint: "Consultoria por período" },
        ]
    },
];

// ─── Cálculo do Pp (soma itens em R$ + percentuais ajustados ao custo) ───────

const calcPp = (params: FormulaParam[]) => {
    let base = 0;
    let pct = 0;
    params.forEach(p => {
        const v = parseFloat(p.value) || 0;
        if (p.unit === "currency") base += v;
        else if (p.unit === "percent") pct += v;
    });
    return base * (1 + pct / 100);
};

const calcPc = (pp: number, msTotal: number, coTotal: number) => {
    const denominator = 1 - coTotal / 100;
    if (denominator <= 0) return 0;
    return (pp * (1 + msTotal / 100)) / denominator;
};

// ─── Sub-componentes ─────────────────────────────────────────────────────────

const InlineInput = ({
    value, onChange, className = ""
}: { value: string; onChange: (v: string) => void; className?: string }) => (
    <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`bg-transparent border-0 border-b border-dashed border-border focus:border-secondary focus:outline-none text-sm font-semibold text-foreground w-full ${className}`}
    />
);

const ParamRow = ({
    param,
    onUpdate,
    onRemove,
}: {
    param: FormulaParam;
    onUpdate: (id: string, field: keyof FormulaParam, value: string) => void;
    onRemove?: (id: string) => void;
}) => (
    <div className="group flex flex-col sm:flex-row sm:items-start gap-3 py-3 border-b border-border/30 last:border-0">
        <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded shrink-0">
                    {param.symbol}
                </span>
                <InlineInput
                    value={param.label}
                    onChange={v => onUpdate(param.id, "label", v)}
                />
            </div>
            <InlineInput
                value={param.description}
                onChange={v => onUpdate(param.id, "description", v)}
                className="text-xs text-muted-foreground font-normal"
            />
        </div>

        <div className="flex items-center gap-2 shrink-0">
            <select
                value={param.unit}
                onChange={e => onUpdate(param.id, "unit", e.target.value)}
                className="text-[10px] bg-muted/50 border border-border/40 rounded px-1.5 py-1 text-muted-foreground cursor-pointer"
            >
                <option value="currency">R$</option>
                <option value="percent">%</option>
                <option value="number">nº</option>
            </select>
            <div className="relative w-28">
                {param.unit === "currency" && <DollarSign className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />}
                {param.unit === "percent" && <Percent className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />}
                <Input
                    type="number"
                    step="0.01"
                    value={param.value}
                    onChange={e => onUpdate(param.id, "value", e.target.value)}
                    className={`${param.unit !== "number" ? "pl-7" : ""} bg-background/60 border-border/50 font-mono text-sm h-9 focus:border-secondary/50`}
                />
            </div>
            {param.removable && onRemove && (
                <button
                    onClick={() => onRemove(param.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 rounded"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    </div>
);

// ─── Componente Principal ─────────────────────────────────────────────────────

const PricingParametersPage = () => {
    const [msParams, setMsParams] = useState<FormulaParam[]>(initialSharedMs);
    const [coParams, setCoParams] = useState<FormulaParam[]>(initialSharedCo);
    const [plans, setPlans] = useState<PlanConfig[]>(initialPlans);
    const [isDirty, setIsDirty] = useState(false);
    const [simPlan, setSimPlan] = useState("basico");

    // ── Shared updaters ─────────────────────────────────────────────────────

    const touch = () => setIsDirty(true);

    const updateShared = (
        setter: React.Dispatch<React.SetStateAction<FormulaParam[]>>,
        id: string, field: keyof FormulaParam, value: string
    ) => {
        setter(ps => ps.map(p => p.id === id ? { ...p, [field]: value } : p));
        touch();
    };

    const removeShared = (
        setter: React.Dispatch<React.SetStateAction<FormulaParam[]>>,
        id: string
    ) => {
        setter(ps => ps.filter(p => p.id !== id));
        touch();
    };

    const addShared = (
        setter: React.Dispatch<React.SetStateAction<FormulaParam[]>>,
        currentItems: FormulaParam[],
        prefix: string
    ) => {
        const next = currentItems.length + 1;
        setter(ps => [...ps, makeNewParam(`${prefix}${next}`)]);
        touch();
    };

    // ── Plan updaters ────────────────────────────────────────────────────────

    const updatePlan = (planId: string, id: string, field: keyof FormulaParam, value: string) => {
        setPlans(ps => ps.map(plan =>
            plan.id === planId
                ? { ...plan, params: plan.params.map(p => p.id === id ? { ...p, [field]: value } : p) }
                : plan
        ));
        touch();
    };

    const removePlanParam = (planId: string, id: string) => {
        setPlans(ps => ps.map(plan =>
            plan.id === planId
                ? { ...plan, params: plan.params.filter(p => p.id !== id) }
                : plan
        ));
        touch();
    };

    const addPlanParam = (planId: string, currentParams: FormulaParam[]) => {
        const next = currentParams.length + 1;
        setPlans(ps => ps.map(plan =>
            plan.id === planId
                ? { ...plan, params: [...plan.params, { ...makeNewParam(`Pp${next}`, "currency"), removable: true }] }
                : plan
        ));
        touch();
    };

    // ── Derived calculations ─────────────────────────────────────────────────

    const totalMs = msParams.reduce((s, p) => s + (parseFloat(p.value) || 0), 0);
    const totalCo = coParams.reduce((s, p) => s + (parseFloat(p.value) || 0), 0);

    const planPcs = plans.map(plan => ({
        id: plan.id,
        label: plan.label,
        icon: plan.icon,
        color: plan.color,
        pp: calcPp(plan.params),
        pc: calcPc(calcPp(plan.params), totalMs, totalCo),
    }));

    const simData = planPcs.find(p => p.id === simPlan);

    const handleSaveAll = () => {
        toast.success("Parâmetros salvos! (Persistência no banco em breve)");
        setIsDirty(false);
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
                    <Button
                        onClick={handleSaveAll}
                        disabled={!isDirty}
                        className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2 shadow-lg shadow-secondary/20 shrink-0"
                    >
                        <Save className="w-4 h-4" />
                        {isDirty ? "Salvar Alterações" : "Nenhuma Alteração"}
                    </Button>
                </header>

                {/* ═══════════════════════════════════════════════════════════
                    SIMULADOR (TOPO)
                ═══════════════════════════════════════════════════════════ */}
                <Card className="border-secondary/30 bg-gradient-to-br from-secondary/5 via-card to-card shadow-xl shadow-secondary/10 overflow-hidden">
                    <CardHeader className="border-b border-border/30 pb-4">
                        <div className="flex items-center gap-2">
                            <PlayCircle className="w-5 h-5 text-secondary" />
                            <CardTitle className="text-base">Simulador de Preços</CardTitle>
                            <Badge variant="outline" className="text-[10px] ml-1">Tempo Real</Badge>
                        </div>
                        <CardDescription>Selecione um plano para ver o Pc calculado com os parâmetros atuais.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {/* Seletor de plano */}
                        <div className="flex flex-wrap gap-3 mb-8">
                            {plans.map(plan => {
                                const PIcon = plan.icon;
                                return (
                                    <button
                                        key={plan.id}
                                        onClick={() => setSimPlan(plan.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-sm transition-all ${simPlan === plan.id
                                                ? `${plan.bgColor} ${plan.color} ${plan.borderColor} shadow-md scale-105`
                                                : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60"
                                            }`}
                                    >
                                        <PIcon className="w-4 h-4" />
                                        {plan.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Resultado */}
                        {simData && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center p-5 rounded-2xl bg-background/70 border border-border/50 gap-1">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Pp (base)</span>
                                    <span className="font-mono font-extrabold text-xl text-foreground">
                                        R$ {simData.pp.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 gap-1">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Ms</span>
                                    <span className="font-mono font-extrabold text-xl text-emerald-500">{totalMs.toFixed(1)}%</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 gap-1">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Co</span>
                                    <span className="font-mono font-extrabold text-xl text-rose-500">{totalCo.toFixed(1)}%</span>
                                </div>
                                <div className={`flex flex-col items-center justify-center p-5 rounded-2xl border gap-1 ${plans.find(p => p.id === simPlan)?.bgColor
                                    } ${plans.find(p => p.id === simPlan)?.borderColor}`}>
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Pc Final</span>
                                    <span className={`font-mono font-extrabold text-2xl ${plans.find(p => p.id === simPlan)?.color}`}>
                                        R$ {simData.pc.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Comparativo de todos os planos */}
                        <div className="mt-6 pt-5 border-t border-border/30">
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-3">Comparativo de Planos</p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                {planPcs.map(plan => {
                                    const PIcon = plan.icon;
                                    return (
                                        <div key={plan.id} className="flex-1 flex items-center justify-between sm:flex-col sm:items-center p-3 rounded-xl bg-background/50 border border-border/40 gap-2">
                                            <div className={`flex items-center gap-1.5 ${plan.color}`}>
                                                <PIcon className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold">{plan.label}</span>
                                            </div>
                                            <span className="font-mono font-extrabold text-base text-foreground">
                                                R$ {plan.pc.toFixed(2)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ═══════════════════════════════════════════════════════════
                    PARÂMETROS COMUNS (Ms e Co)
                ═══════════════════════════════════════════════════════════ */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Globe className="w-5 h-5 text-muted-foreground" />
                        <h2 className="text-lg font-bold text-foreground">Parâmetros Comuns a Todos os Planos</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">

                        {/* Ms */}
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-md">
                            <CardHeader className="pb-2 border-b border-border/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                                        <CardTitle className="text-base">Margens de Segurança (Ms)</CardTitle>
                                    </div>
                                    <Badge className="font-mono bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                        {totalMs.toFixed(1)}%
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs">Soma de todos os percentuais abaixo.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-2">
                                {msParams.map(p => (
                                    <ParamRow
                                        key={p.id}
                                        param={p}
                                        onUpdate={(id, field, v) => updateShared(setMsParams, id, field, v)}
                                        onRemove={p.removable ? (id) => removeShared(setMsParams, id) : undefined}
                                    />
                                ))}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-3 w-full gap-2 border border-dashed border-border/50 text-muted-foreground hover:text-emerald-500 hover:border-emerald-500/40 hover:bg-emerald-500/5"
                                    onClick={() => addShared(setMsParams, msParams, "Ms")}
                                >
                                    <Plus className="w-4 h-4" /> Adicionar Despesa
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
                                    <Badge className="font-mono bg-rose-500/10 text-rose-500 border-rose-500/20">
                                        {totalCo.toFixed(1)}%
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs">Deduções que impactam a margem final.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-2">
                                {coParams.map(p => (
                                    <ParamRow
                                        key={p.id}
                                        param={p}
                                        onUpdate={(id, field, v) => updateShared(setCoParams, id, field, v)}
                                        onRemove={p.removable ? (id) => removeShared(setCoParams, id) : undefined}
                                    />
                                ))}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-3 w-full gap-2 border border-dashed border-border/50 text-muted-foreground hover:text-rose-500 hover:border-rose-500/40 hover:bg-rose-500/5"
                                    onClick={() => addShared(setCoParams, coParams, "Co")}
                                >
                                    <Plus className="w-4 h-4" /> Adicionar Despesa
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                {/* ═══════════════════════════════════════════════════════════
                    PARÂMETROS POR PLANO (Pp)
                ═══════════════════════════════════════════════════════════ */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Settings2 className="w-5 h-5 text-muted-foreground" />
                        <h2 className="text-lg font-bold text-foreground">Composição por Plano — Pp</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {plans.map(plan => {
                            const PlanIcon = plan.icon;
                            const pp = calcPp(plan.params);
                            const pc = calcPc(pp, totalMs, totalCo);
                            return (
                                <Card key={plan.id} className={`border ${plan.borderColor} bg-card/60 backdrop-blur-sm shadow-md overflow-hidden`}>
                                    <CardHeader className={`pb-3 border-b border-border/30 ${plan.bgColor}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className={`flex items-center gap-2 ${plan.color}`}>
                                                <PlanIcon className="w-5 h-5" />
                                                <CardTitle className="text-base">{plan.label}</CardTitle>
                                            </div>
                                            <Badge className={`text-[10px] font-bold ${plan.bgColor} ${plan.color} ${plan.borderColor}`}>
                                                {plan.badge}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between pt-1">
                                            <span className="text-[11px] text-muted-foreground">Pc estimado:</span>
                                            <span className={`font-mono font-extrabold text-xl ${plan.color}`}>
                                                R$ {pc.toFixed(2)}
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-2">
                                        {plan.params.map(p => (
                                            <ParamRow
                                                key={p.id}
                                                param={p}
                                                onUpdate={(id, field, v) => updatePlan(plan.id, id, field, v)}
                                                onRemove={p.removable ? (id) => removePlanParam(plan.id, id) : undefined}
                                            />
                                        ))}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`mt-3 w-full gap-2 border border-dashed border-border/50 text-muted-foreground hover:${plan.color} hover:border-opacity-40 hover:${plan.bgColor}`}
                                            onClick={() => addPlanParam(plan.id, plan.params)}
                                        >
                                            <Plus className="w-4 h-4" /> Adicionar Item ao Plano
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                <Separator />

                {/* ═══════════════════════════════════════════════════════════
                    FÓRMULA (FINAL)
                ═══════════════════════════════════════════════════════════ */}
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
                                <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">Equação base</p>
                                <p className="font-mono font-extrabold text-3xl md:text-4xl text-foreground tracking-tight mb-4">
                                    P<sub className="text-lg">c</sub> = <span className="text-secondary">P<sub className="text-lg">p</sub> × (1 + M<sub className="text-lg">s</sub>)</span> / (1 − C<sub className="text-lg">o</sub>)
                                </p>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    <strong className="text-foreground">Pc</strong> = Preço final do plano &nbsp;|&nbsp;
                                    <strong className="text-foreground">Pp</strong> = Custo base (varia por plano) &nbsp;|&nbsp;
                                    <strong className="text-foreground">Ms</strong> = Soma das margens de segurança &nbsp;|&nbsp;
                                    <strong className="text-foreground">Co</strong> = Soma dos custos operacionais
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

                {/* ── Aviso ── */}
                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl border border-border/40 text-sm text-muted-foreground">
                    <Info className="w-4 h-4 mt-0.5 shrink-0 text-secondary" />
                    <p>
                        Os valores exibidos são <strong className="text-foreground">estimativas em tempo real</strong>. A persistência no banco de dados (Supabase) será ativada na próxima fase, junto com a conexão ao simulador de contratação.
                    </p>
                </div>

            </div>
        </DashboardLayout>
    );
};

export default PricingParametersPage;

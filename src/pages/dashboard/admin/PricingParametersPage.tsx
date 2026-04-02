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
    BarChart3
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormulaParam {
    key: string;
    label: string;
    symbol: string;
    value: string;
    description: string;
    unit: "percent" | "currency" | "number";
    hint?: string;
}

// ─── Dados iniciais (frontend-only / casca) ─────────────────────────────────

const initialSharedMs: FormulaParam[] = [
    {
        key: "ms_administracao",
        label: "Despesas Administrativas",
        symbol: "Ms₁",
        value: "8",
        description: "Percentual que cobre custos de gestão, TI e equipe interna.",
        unit: "percent",
        hint: "Normalmente entre 5% e 15%"
    },
    {
        key: "ms_inadimplencia",
        label: "Provisão para Inadimplência",
        symbol: "Ms₂",
        value: "3",
        description: "Margem de segurança para atrasos e inadimplências esperadas.",
        unit: "percent",
        hint: "Recomendado: 2% a 5%"
    },
    {
        key: "ms_sinistralidade",
        label: "Provisão para Sinistros",
        symbol: "Ms₃",
        value: "4",
        description: "Reserva técnica para acionamentos e demandas imprevistas.",
        unit: "percent",
        hint: "Recomendado: 3% a 7%"
    },
];

const initialSharedCo: FormulaParam[] = [
    {
        key: "co_impostos",
        label: "Impostos e Tributação",
        symbol: "Co₁",
        value: "12",
        description: "Carga tributária total incidente sobre o faturamento.",
        unit: "percent",
        hint: "ISS + PIS + COFINS + CSLL"
    },
    {
        key: "co_comissao",
        label: "Comissão de Parceiros",
        symbol: "Co₂",
        value: "5",
        description: "Comissão paga às imobiliárias parceiras pelo serviço.",
        unit: "percent",
        hint: "Variável por contrato de parceria"
    },
    {
        key: "co_plataforma",
        label: "Custo de Operação da Plataforma",
        symbol: "Co₃",
        value: "3",
        description: "Manutenção da infraestrutura tecnológica (Vercel, Supabase, APIs).",
        unit: "percent",
        hint: "Revise semestralmente"
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
        id: "basico",
        label: "Plano Básico",
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/20",
        icon: Zap,
        badge: "Entrada",
        params: [
            {
                key: "pp_basico_custo_servico",
                label: "Custo Base do Serviço",
                symbol: "Pp₁",
                value: "120",
                description: "Custo mínimo para prestação do serviço no plano básico.",
                unit: "currency",
                hint: "Custo real operacional da entrega"
            },
            {
                key: "pp_basico_cobertura",
                label: "Cobertura de Garantia",
                symbol: "Pp₂",
                value: "15",
                description: "Percentual adicional para cobertura de garantias básicas.",
                unit: "percent",
                hint: "Coberturas do plano básico"
            },
        ]
    },
    {
        id: "medio",
        label: "Plano Médio",
        color: "text-secondary",
        bgColor: "bg-secondary/10",
        borderColor: "border-secondary/20",
        icon: Star,
        badge: "Recomendado",
        params: [
            {
                key: "pp_medio_custo_servico",
                label: "Custo Base do Serviço",
                symbol: "Pp₁",
                value: "180",
                description: "Custo operacional para prestação do serviço no plano médio.",
                unit: "currency",
                hint: "Inclui serviços intermediários"
            },
            {
                key: "pp_medio_cobertura",
                label: "Cobertura de Garantia",
                symbol: "Pp₂",
                value: "25",
                description: "Percentual adicional para coberturas ampliadas.",
                unit: "percent",
                hint: "Coberturas intermediárias"
            },
            {
                key: "pp_medio_vistoria",
                label: "Módulo de Vistoria",
                symbol: "Pp₃",
                value: "30",
                description: "Custo adicional pelo módulo de vistoria incluso no plano.",
                unit: "currency",
                hint: "Vistoria de entrada e saída"
            },
        ]
    },
    {
        id: "alto",
        label: "Plano Alto Padrão",
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/20",
        icon: Crown,
        badge: "Premium",
        params: [
            {
                key: "pp_alto_custo_servico",
                label: "Custo Base do Serviço",
                symbol: "Pp₁",
                value: "280",
                description: "Custo operacional para a entrega do plano premium completo.",
                unit: "currency",
                hint: "Inclui todos os serviços"
            },
            {
                key: "pp_alto_cobertura",
                label: "Cobertura de Garantia Premium",
                symbol: "Pp₂",
                value: "40",
                description: "Percentual de cobertura total com garantias ampliadas.",
                unit: "percent",
                hint: "Cobertura máxima disponível"
            },
            {
                key: "pp_alto_vistoria",
                label: "Módulo de Vistoria Premium",
                symbol: "Pp₃",
                value: "50",
                description: "Vistoria detalhada com laudo técnico e fotos.",
                unit: "currency",
                hint: "Laudo técnico incluso"
            },
            {
                key: "pp_alto_assessoria",
                label: "Assessoria Jurídica",
                symbol: "Pp₄",
                value: "45",
                description: "Suporte jurídico especializado para contratos de alto valor.",
                unit: "currency",
                hint: "Consultoria por período"
            },
        ]
    },
];

// ─── Sub-componentes ─────────────────────────────────────────────────────────

const UnitIcon = ({ unit }: { unit: FormulaParam["unit"] }) => {
    if (unit === "percent") return <Percent className="w-3 h-3 text-muted-foreground" />;
    if (unit === "currency") return <DollarSign className="w-3 h-3 text-muted-foreground" />;
    return <BarChart3 className="w-3 h-3 text-muted-foreground" />;
};

const ParamRow = ({
    param,
    onChange
}: {
    param: FormulaParam;
    onChange: (key: string, value: string) => void;
}) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 border-b border-border/40 last:border-0">
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono text-xs font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">
                    {param.symbol}
                </span>
                <span className="font-semibold text-sm text-foreground">{param.label}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{param.description}</p>
            {param.hint && (
                <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1 mt-1">
                    <HelpCircle className="w-2.5 h-2.5" /> {param.hint}
                </p>
            )}
        </div>
        <div className="flex items-center gap-2 sm:w-40 shrink-0">
            <div className="relative flex-1">
                <UnitIcon unit={param.unit} />
                <Input
                    type="number"
                    step="0.01"
                    value={param.value}
                    onChange={(e) => onChange(param.key, e.target.value)}
                    className="pl-7 bg-background/60 border-border/50 font-mono text-sm h-9 focus:border-secondary/50 focus:ring-secondary/20"
                />
            </div>
            {param.unit === "percent" && (
                <span className="text-xs text-muted-foreground font-mono">%</span>
            )}
        </div>
    </div>
);

// ─── Componente Principal ────────────────────────────────────────────────────

const PricingParametersPage = () => {
    const [msParams, setMsParams] = useState<FormulaParam[]>(initialSharedMs);
    const [coParams, setCoParams] = useState<FormulaParam[]>(initialSharedCo);
    const [plans, setPlans] = useState<PlanConfig[]>(initialPlans);
    const [isDirty, setIsDirty] = useState(false);

    const updateMs = (key: string, value: string) => {
        setMsParams(p => p.map(x => x.key === key ? { ...x, value } : x));
        setIsDirty(true);
    };

    const updateCo = (key: string, value: string) => {
        setCoParams(p => p.map(x => x.key === key ? { ...x, value } : x));
        setIsDirty(true);
    };

    const updatePlan = (planId: string, key: string, value: string) => {
        setPlans(ps => ps.map(plan =>
            plan.id === planId
                ? { ...plan, params: plan.params.map(p => p.key === key ? { ...p, value } : p) }
                : plan
        ));
        setIsDirty(true);
    };

    const handleSaveAll = () => {
        // Futuramente: persistir no Supabase
        toast.success("Parâmetros salvos! (Persistência no banco em breve)");
        setIsDirty(false);
    };

    const totalMs = msParams.reduce((s, p) => s + (parseFloat(p.value) || 0), 0);
    const totalCo = coParams.reduce((s, p) => s + (parseFloat(p.value) || 0), 0);

    return (
        <DashboardLayout role="admin">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">

                {/* ── Header ── */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">
                            Parâmetros de Cálculo
                        </h1>
                        <p className="text-muted-foreground">
                            Ajuste os fatores que alimentam o preço final (Pc) de cada plano da plataforma.
                        </p>
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

                {/* ── Fórmula Banner ── */}
                <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 via-card to-card shadow-xl shadow-secondary/10 overflow-hidden">
                    <CardContent className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <Calculator className="w-5 h-5 text-secondary" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-secondary">Fórmula Atuarial</span>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-mono font-extrabold text-foreground mb-4 tracking-tight">
                                    P<sub className="text-lg">c</sub> = <span className="text-secondary/80">P<sub className="text-lg">p</sub> × (1 + M<sub className="text-lg">s</sub>)</span> / (1 − C<sub className="text-lg">o</sub>)
                                </h2>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    O preço final do plano (<strong className="text-foreground">Pc</strong>) é calculado a partir do custo base do plano (<strong className="text-foreground">Pp</strong>), acrescido das margens de segurança (<strong className="text-foreground">Ms</strong>) e dividido pelo complemento dos custos operacionais (<strong className="text-foreground">Co</strong>).
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-4 w-full md:w-auto md:min-w-[260px] shrink-0">
                                <div className="flex flex-col items-center p-3 bg-background/60 rounded-xl border border-border/50 gap-1">
                                    <span className="font-mono font-extrabold text-lg text-foreground">Pp</span>
                                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest text-center leading-tight">Por Plano</span>
                                </div>
                                <div className="flex flex-col items-center p-3 bg-background/60 rounded-xl border border-border/50 gap-1">
                                    <span className="font-mono font-extrabold text-lg text-secondary">{totalMs.toFixed(1)}%</span>
                                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest text-center leading-tight">Ms Total</span>
                                </div>
                                <div className="flex flex-col items-center p-3 bg-background/60 rounded-xl border border-border/50 gap-1">
                                    <span className="font-mono font-extrabold text-lg text-secondary">{totalCo.toFixed(1)}%</span>
                                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest text-center leading-tight">Co Total</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Parâmetros Compartilhados (Ms e Co) ── */}
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
                                        <CardTitle className="text-base">Margens de Segurança</CardTitle>
                                    </div>
                                    <Badge className="font-mono bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                        Ms = {totalMs.toFixed(1)}%
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs">
                                    Compõem o <strong>Ms</strong> — soma de todos os percentuais abaixo.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-2">
                                {msParams.map(p => (
                                    <ParamRow key={p.key} param={p} onChange={updateMs} />
                                ))}
                            </CardContent>
                        </Card>

                        {/* Co */}
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-md">
                            <CardHeader className="pb-2 border-b border-border/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-rose-500" />
                                        <CardTitle className="text-base">Custos Operacionais</CardTitle>
                                    </div>
                                    <Badge className="font-mono bg-rose-500/10 text-rose-500 border-rose-500/20">
                                        Co = {totalCo.toFixed(1)}%
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs">
                                    Compõem o <strong>Co</strong> — deduções que impactam a margem final.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-2">
                                {coParams.map(p => (
                                    <ParamRow key={p.key} param={p} onChange={updateCo} />
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                {/* ── Parâmetros por Plano (Pp) ── */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Settings2 className="w-5 h-5 text-muted-foreground" />
                        <h2 className="text-lg font-bold text-foreground">Composição por Plano — Pp (Custo Base)</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {plans.map(plan => {
                            const PlanIcon = plan.icon;
                            const ppTotal = plan.params.reduce((s, p) => {
                                if (p.unit === "currency") return s + (parseFloat(p.value) || 0);
                                return s;
                            }, 0);
                            const msFrac = totalMs / 100;
                            const coFrac = totalCo / 100;
                            const pc = coFrac < 1 ? (ppTotal * (1 + msFrac)) / (1 - coFrac) : 0;

                            return (
                                <Card
                                    key={plan.id}
                                    className={`border ${plan.borderColor} bg-card/60 backdrop-blur-sm shadow-md overflow-hidden`}
                                >
                                    <CardHeader className={`pb-3 border-b border-border/30 ${plan.bgColor} bg-opacity-30`}>
                                        <div className="flex items-center justify-between mb-1">
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
                                            <span className={`font-mono font-extrabold text-lg ${plan.color}`}>
                                                {pc > 0 ? `R$ ${pc.toFixed(2)}` : "—"}
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-2">
                                        {plan.params.map(p => (
                                            <ParamRow
                                                key={p.key}
                                                param={p}
                                                onChange={(key, val) => updatePlan(plan.id, key, val)}
                                            />
                                        ))}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* ── Aviso ── */}
                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl border border-border/40 text-sm text-muted-foreground">
                    <Info className="w-4 h-4 mt-0.5 shrink-0 text-secondary" />
                    <p>
                        Os valores exibidos são <strong className="text-foreground">estimativas em tempo real</strong> com base nos parâmetros inseridos. A persistência no banco de dados (Supabase) será ativada na próxima fase, junto com a conexão ao simulador de planos.
                    </p>
                </div>

            </div>
        </DashboardLayout>
    );
};

export default PricingParametersPage;

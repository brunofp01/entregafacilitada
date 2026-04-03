import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
    Save, Plus, Trash2, Loader2, Pencil, Check, X,
    Zap, Star, ShieldCheck, Layout, Eye, EyeOff,
    DollarSign, Percent, Ruler, Package
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { FormulaParam, PlanConfig, calcPp, calcPc, sumActive } from "@/lib/pricingCalc";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 8);

const COLOR_OPTIONS = [
    { label: "Azul", color: "text-blue-500", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30" },
    { label: "Verde", color: "text-emerald-500", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/30" },
    { label: "Roxo", color: "text-violet-500", bgColor: "bg-violet-500/10", borderColor: "border-violet-500/30" },
    { label: "Âmbar", color: "text-amber-500", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/30" },
    { label: "Rosa", color: "text-pink-500", bgColor: "bg-pink-500/10", borderColor: "border-pink-500/30" },
    { label: "Ciano", color: "text-cyan-500", bgColor: "bg-cyan-500/10", borderColor: "border-cyan-500/30" },
    { label: "Laranja", color: "text-orange-500", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/30" },
    { label: "Índigo", color: "text-indigo-500", bgColor: "bg-indigo-500/10", borderColor: "border-indigo-500/30" },
];

const ICON_OPTIONS = [
    { label: "Zap", icon: Zap },
    { label: "Star", icon: Star },
    { label: "Shield", icon: ShieldCheck },
    { label: "Layout", icon: Layout },
    { label: "Package", icon: Package },
];

const makeParam = (unit: FormulaParam["unit"] = "currency"): FormulaParam => ({
    id: uid(), label: "Novo item", value: "0", unit, active: true, removable: true,
});

const makePlan = (): PlanConfig => ({
    id: uid(),
    label: "Novo Plano",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    badge: "Novo",
    params: [
        { id: uid(), label: "Custo de Material (Composição)", value: "0", unit: "currency", active: true, readonly: true },
        { id: uid(), label: "Custo de Mão de Obra (Composição)", value: "0", unit: "currency", active: true, readonly: true },
        { id: uid(), label: "Projeção INCC Acumulado", value: "8", unit: "percent", active: true },
    ],
});

// ─── Toggle ───────────────────────────────────────────────────────────────────
const ToggleSwitch = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => (
    <button
        type="button"
        onClick={onToggle}
        className={`relative shrink-0 w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${active ? "bg-secondary" : "bg-muted-foreground/30"}`}
    >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${active ? "translate-x-4" : "translate-x-0"}`} />
    </button>
);

// ─── ParamEditor ─────────────────────────────────────────────────────────────
const ParamEditor = ({ param, onUpdate, onRemove, onToggle }: {
    param: FormulaParam;
    onUpdate: (id: string, field: "label" | "value" | "unit", v: string) => void;
    onRemove?: (id: string) => void;
    onToggle: (id: string) => void;
}) => (
    <div className={`group flex items-center gap-2 py-2.5 border-b border-border/30 last:border-0 transition-opacity ${param.active ? "opacity-100" : "opacity-40"}`}>
        <ToggleSwitch active={param.active} onToggle={() => onToggle(param.id)} />
        <div className="flex-1 min-w-0">
            <input
                type="text"
                value={param.label}
                onChange={e => onUpdate(param.id, "label", e.target.value)}
                disabled={!param.active || param.readonly}
                className="bg-transparent border-0 focus:outline-none text-sm font-medium text-foreground w-full disabled:cursor-not-allowed"
                placeholder="Nome do parâmetro"
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
                    className={`${param.unit !== "number" ? "pl-6" : ""} bg-background/60 border-border/50 font-mono text-sm h-8 disabled:cursor-not-allowed`}
                />
            </div>
            {param.removable && onRemove && (
                <button type="button" onClick={() => onRemove(param.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 rounded">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const PlanoGestaoPage = () => {
    const [plans, setPlans] = useState<PlanConfig[]>([]);
    const [msTotal, setMsTotal] = useState(0);
    const [coTotal, setCoTotal] = useState(0);
    const [installments, setInstallments] = useState(24);
    const [simArea, setSimArea] = useState(60);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
    const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

    // ── Load from Supabase ────────────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const { data } = await supabase.from('pricing_parameters_config').select('*').eq('id', 1).single();
            if (data) {
                if (data.plans?.length) {
                    const iconMap: Record<string, any> = { Zap, Star, ShieldCheck, Layout, Package };
                    const restored = data.plans.map((p: any) => ({
                        ...p,
                        icon: iconMap[p.iconName] || Zap,
                    }));
                    setPlans(restored);
                }
                if (data.ms_params) setMsTotal(sumActive(data.ms_params));
                if (data.co_params) setCoTotal(sumActive(data.co_params));
                if (data.installments) setInstallments(data.installments);
            }
            setLoading(false);
        };
        load();
    }, []);

    const touch = () => setIsDirty(true);

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true);
        const iconNameMap = new Map([
            [Zap, "Zap"], [Star, "Star"], [ShieldCheck, "ShieldCheck"],
            [Layout, "Layout"], [Package, "Package"],
        ]);
        const plansToSave = plans.map(p => ({
            ...p,
            iconName: iconNameMap.get(p.icon as any) || "Zap",
            icon: undefined,
        }));
        // Fetch full config first so we don't overwrite ms/co/installments
        const { data: existing } = await supabase.from('pricing_parameters_config').select('*').eq('id', 1).single();
        const { error } = await supabase.from('pricing_parameters_config').upsert({
            id: 1,
            ms_params: existing?.ms_params,
            co_params: existing?.co_params,
            installments: existing?.installments ?? installments,
            plans: plansToSave,
            updated_at: new Date().toISOString(),
        });
        setSaving(false);
        if (error) {
            toast.error("Erro ao salvar planos.");
            console.error(error);
        } else {
            toast.success("Planos salvos com sucesso!");
            setIsDirty(false);
        }
    };

    // ── Plan CRUD ─────────────────────────────────────────────────────────────
    const addPlan = () => {
        const np = makePlan();
        setPlans(ps => [...ps, np]);
        setEditingPlanId(np.id);
        touch();
    };

    const deletePlan = (id: string) => {
        setPlans(ps => ps.filter(p => p.id !== id));
        setDeletingPlanId(null);
        touch();
    };

    const updatePlanMeta = (id: string, field: keyof PlanConfig, value: any) => {
        setPlans(ps => ps.map(p => p.id === id ? { ...p, [field]: value } : p));
        touch();
    };

    const applyColor = (planId: string, opt: typeof COLOR_OPTIONS[0]) => {
        setPlans(ps => ps.map(p => p.id === planId ? { ...p, color: opt.color, bgColor: opt.bgColor, borderColor: opt.borderColor } : p));
        touch();
    };

    const applyIcon = (planId: string, icon: any) => {
        setPlans(ps => ps.map(p => p.id === planId ? { ...p, icon } : p));
        touch();
    };

    // ── Param CRUD ────────────────────────────────────────────────────────────
    const updateParam = (planId: string, paramId: string, field: any, v: string) => {
        setPlans(ps => ps.map(p => p.id === planId
            ? { ...p, params: p.params.map(pm => pm.id === paramId ? { ...pm, [field]: v } : pm) }
            : p));
        touch();
    };

    const toggleParam = (planId: string, paramId: string) => {
        setPlans(ps => ps.map(p => p.id === planId
            ? { ...p, params: p.params.map(pm => pm.id === paramId ? { ...pm, active: !pm.active } : pm) }
            : p));
        touch();
    };

    const removeParam = (planId: string, paramId: string) => {
        setPlans(ps => ps.map(p => p.id === planId
            ? { ...p, params: p.params.filter(pm => pm.id !== paramId) }
            : p));
        touch();
    };

    const addParam = (planId: string) => {
        setPlans(ps => ps.map(p => p.id === planId
            ? { ...p, params: [...p.params, makeParam("currency")] }
            : p));
        touch();
    };

    if (loading) {
        return (
            <DashboardLayout role="admin">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-secondary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="admin">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">Gestão de Planos</h1>
                        <p className="text-muted-foreground">Crie, edite e gerencie os planos comerciais disponíveis para contratação.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={addPlan} className="gap-2">
                            <Plus className="w-4 h-4" /> Novo Plano
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!isDirty || saving}
                            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2 shadow-lg shadow-secondary/20"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isDirty ? "Salvar Alterações" : "Salvo"}
                        </Button>
                    </div>
                </header>

                {/* Simulator */}
                <Card className="border-secondary/30 bg-gradient-to-br from-secondary/5 via-card to-card shadow-xl shadow-secondary/10">
                    <CardHeader className="border-b border-border/30 pb-4">
                        <div className="flex items-center gap-2">
                            <Ruler className="w-5 h-5 text-secondary" />
                            <CardTitle className="text-base">Simulador de Preços</CardTitle>
                            <Badge variant="outline" className="text-[10px] ml-1">Tempo Real</Badge>
                        </div>
                        <CardDescription>Veja como os planos se comportam para diferentes áreas.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="mb-6 p-4 bg-background/50 rounded-xl border border-border/40">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-semibold text-foreground">Área do imóvel</label>
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

                        {plans.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {plans.map(plan => {
                                    const PIcon = plan.icon || Zap;
                                    const pp = calcPp(plan.params, simArea);
                                    const pc = calcPc(pp, msTotal, coTotal);
                                    const monthly = installments > 0 ? pc / installments : 0;
                                    return (
                                        <div key={plan.id} className={`p-4 rounded-xl border ${plan.borderColor} ${plan.bgColor}`}>
                                            <div className={`flex items-center gap-2 mb-3 ${plan.color}`}>
                                                <PIcon className="w-4 h-4" />
                                                <span className="font-bold text-sm">{plan.label}</span>
                                                <Badge className={`ml-auto text-[9px] font-bold ${plan.bgColor} ${plan.color} ${plan.borderColor}`}>{plan.badge}</Badge>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Valor Total</div>
                                                    <div className={`font-mono font-extrabold text-xl ${plan.color}`}>R$ {pc.toFixed(2)}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{installments}x de</div>
                                                    <div className={`font-mono font-extrabold text-xl ${plan.color}`}>R$ {monthly.toFixed(2)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">Nenhum plano criado ainda. Clique em "Novo Plano" para começar.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Separator />

                {/* Plans List */}
                <div>
                    <div className="flex items-center gap-2 mb-6">
                        <Layout className="w-5 h-5 text-muted-foreground" />
                        <h2 className="text-lg font-bold">Planos Cadastrados ({plans.length})</h2>
                    </div>

                    {plans.length === 0 && (
                        <div className="text-center py-16 border-2 border-dashed border-border/40 rounded-2xl text-muted-foreground">
                            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-semibold text-base">Nenhum plano cadastrado</p>
                            <p className="text-sm mt-1">Clique em "Novo Plano" no cabeçalho para criar o primeiro.</p>
                        </div>
                    )}

                    <div className="space-y-6">
                        {plans.map((plan, idx) => {
                            const PIcon = plan.icon || Zap;
                            const pp = calcPp(plan.params, simArea);
                            const pc = calcPc(pp, msTotal, coTotal);
                            const monthly = installments > 0 ? pc / installments : 0;
                            const isEditing = editingPlanId === plan.id;

                            return (
                                <Card key={plan.id} className={`border-2 ${isEditing ? plan.borderColor : "border-border/50"} bg-card/80 backdrop-blur-sm shadow-md transition-all duration-300`}>
                                    <CardHeader className={`pb-4 border-b border-border/30 ${plan.bgColor}`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className={`flex items-center gap-3 ${plan.color}`}>
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.bgColor} border ${plan.borderColor}`}>
                                                    <PIcon className="w-5 h-5" />
                                                </div>
                                                {isEditing ? (
                                                    <div className="space-y-1">
                                                        <Input
                                                            value={plan.label}
                                                            onChange={e => updatePlanMeta(plan.id, "label", e.target.value)}
                                                            className="h-8 font-bold text-foreground w-52"
                                                            placeholder="Nome do plano"
                                                        />
                                                        <Input
                                                            value={plan.badge}
                                                            onChange={e => updatePlanMeta(plan.id, "badge", e.target.value)}
                                                            className="h-7 text-xs w-36"
                                                            placeholder="Etiqueta (ex: Recomendado)"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <CardTitle className="text-base">
                                                            <span className="mr-2 text-muted-foreground text-sm font-normal">#{idx + 1}</span>
                                                            {plan.label}
                                                        </CardTitle>
                                                        <Badge className={`text-[10px] mt-1 ${plan.bgColor} ${plan.color} ${plan.borderColor}`}>{plan.badge}</Badge>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <div className="text-right mr-3">
                                                    <div className="text-[10px] text-muted-foreground font-bold uppercase">Simulação ({simArea}m²)</div>
                                                    <div className={`font-mono font-extrabold text-sm ${plan.color}`}>R$ {monthly.toFixed(2)}/mês</div>
                                                </div>
                                                {isEditing ? (
                                                    <Button size="icon" variant="ghost" className="text-emerald-500 hover:bg-emerald-500/10 h-8 w-8" onClick={() => setEditingPlanId(null)}>
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                ) : (
                                                    <Button size="icon" variant="ghost" className="text-muted-foreground h-8 w-8" onClick={() => setEditingPlanId(plan.id)}>
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {deletingPlanId === plan.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10 h-8 w-8" onClick={() => deletePlan(plan.id)}>
                                                            <Check className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDeletingPlanId(null)}>
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive h-8 w-8" onClick={() => setDeletingPlanId(plan.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {isEditing && (
                                            <div className="mt-4 space-y-3 pt-3 border-t border-border/20">
                                                {/* Color picker */}
                                                <div>
                                                    <Label className="text-xs text-muted-foreground mb-2 block">Cor do Plano</Label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {COLOR_OPTIONS.map(opt => (
                                                            <button
                                                                key={opt.label}
                                                                type="button"
                                                                title={opt.label}
                                                                onClick={() => applyColor(plan.id, opt)}
                                                                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${plan.color === opt.color ? "border-foreground scale-110 shadow-md" : "border-transparent hover:scale-105"} ${opt.bgColor}`}
                                                            >
                                                                <span className={`w-3 h-3 rounded-full ${opt.color.replace("text-", "bg-")}`} />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                {/* Icon picker */}
                                                <div>
                                                    <Label className="text-xs text-muted-foreground mb-2 block">Ícone</Label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {ICON_OPTIONS.map(opt => {
                                                            const OIcon = opt.icon;
                                                            return (
                                                                <button
                                                                    key={opt.label}
                                                                    type="button"
                                                                    title={opt.label}
                                                                    onClick={() => applyIcon(plan.id, opt.icon)}
                                                                    className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${plan.icon === opt.icon ? `${plan.borderColor} ${plan.bgColor} ${plan.color} scale-110 shadow-md` : "border-border/40 text-muted-foreground hover:scale-105"}`}
                                                                >
                                                                    <OIcon className="w-4 h-4" />
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardHeader>

                                    <CardContent className="pt-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Parâmetros do Prêmio Puro (Pp)</p>
                                            <div className="flex gap-3 text-xs text-muted-foreground font-mono">
                                                <span>Pp: <span className={`font-bold ${plan.color}`}>R$ {pp.toFixed(2)}</span></span>
                                                <span>Pc: <span className={`font-bold ${plan.color}`}>R$ {pc.toFixed(2)}</span></span>
                                            </div>
                                        </div>
                                        {plan.params.map(pm => (
                                            <ParamEditor
                                                key={pm.id}
                                                param={pm}
                                                onUpdate={(id, field, v) => updateParam(plan.id, id, field, v)}
                                                onToggle={(id) => toggleParam(plan.id, id)}
                                                onRemove={pm.removable ? (id) => removeParam(plan.id, id) : undefined}
                                            />
                                        ))}
                                        <Button
                                            variant="ghost" size="sm"
                                            className="mt-3 w-full gap-2 border border-dashed border-border/50 text-muted-foreground hover:text-secondary hover:border-secondary/40 hover:bg-secondary/5"
                                            onClick={() => addParam(plan.id)}
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Adicionar Parâmetro
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom save bar */}
                {isDirty && (
                    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-card/95 backdrop-blur-md border-t border-border shadow-2xl animate-in slide-in-from-bottom-2">
                        <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                            Há alterações não salvas nos planos
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Descartar</Button>
                            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar Agora
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default PlanoGestaoPage;

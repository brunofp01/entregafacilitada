import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Plus, Edit2, Trash2, CheckCircle2, Factory, Hammer, DollarSign, Box } from "lucide-react";
import { toast } from "sonner";

export interface CompositionItem {
    id: string;
    nome: string;
    indiceSinapi: string;
    probabilidade: string;
    rendimento: string;
    valorReferencia: string;
    inBasico: boolean;
    inCompleto: boolean;
}

interface CostCompositionSubpageProps {
    area: number;
    onBack: () => void;
    onApply: (basicoMat: number, basicoLabor: number, completoMat: number, completoLabor: number) => void;
}

const emptyItem: Omit<CompositionItem, "id" | "inBasico" | "inCompleto"> = {
    nome: "",
    indiceSinapi: "",
    probabilidade: "",
    rendimento: "",
    valorReferencia: "",
};

export const CostCompositionSubpage: React.FC<CostCompositionSubpageProps> = ({ area, onBack, onApply }) => {
    const [items, setItems] = useState<CompositionItem[]>([]);
    const [formItem, setFormItem] = useState<Omit<CompositionItem, "id" | "inBasico" | "inCompleto">>(emptyItem);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Calc helper
    const calculateItemValues = (item: Omit<CompositionItem, "id" | "inBasico" | "inCompleto">) => {
        const indice = parseFloat(item.indiceSinapi) || 0;
        const prob = parseFloat(item.probabilidade) || 0;
        const rend = parseFloat(item.rendimento) || 1; // prevent div by zero safely
        const ref = parseFloat(item.valorReferencia) || 0;

        const totalServico = area * indice;
        const execucaoPrevista = totalServico * (prob / 100);

        // Formules: (Execução Prevista / Rendimento) * Valor * [0.57 ou 0.43]
        const mo = rend > 0 ? (execucaoPrevista / rend) * ref * 0.57 : 0;
        const mat = rend > 0 ? (execucaoPrevista / rend) * ref * 0.43 : 0;

        return { totalServico, execucaoPrevista, mo, mat };
    };

    const handleSaveItem = () => {
        if (!formItem.nome || !formItem.rendimento || !formItem.valorReferencia) {
            toast.error("Preencha ao menos Nome, Rendimento e Valor de Referência");
            return;
        }

        if (editingId) {
            setItems(prev => prev.map(i => i.id === editingId ? { ...i, ...formItem } : i));
            toast.success("Item atualizado!");
        } else {
            const newItem: CompositionItem = {
                ...formItem,
                id: Math.random().toString(36).substring(2, 9),
                inBasico: false,
                inCompleto: false,
            };
            setItems(prev => [...prev, newItem]);
            toast.success("Item cadastrado!");
        }

        setFormItem(emptyItem);
        setEditingId(null);
    };

    const handleEditItem = (item: CompositionItem) => {
        setFormItem({
            nome: item.nome,
            indiceSinapi: item.indiceSinapi,
            probabilidade: item.probabilidade,
            rendimento: item.rendimento,
            valorReferencia: item.valorReferencia,
        });
        setEditingId(item.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleRemoveItem = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
        if (editingId === id) {
            setFormItem(emptyItem);
            setEditingId(null);
        }
    };

    const togglePlan = (id: string, plan: "inBasico" | "inCompleto") => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, [plan]: !i[plan] } : i));
    };

    // Calculate plan totals
    const totals = useMemo(() => {
        let basicoMat = 0, basicoLabor = 0;
        let completoMat = 0, completoLabor = 0;

        items.forEach(item => {
            const { mo, mat } = calculateItemValues(item);
            if (item.inBasico) {
                basicoMat += mat;
                basicoLabor += mo;
            }
            if (item.inCompleto) {
                completoMat += mat;
                completoLabor += mo;
            }
        });

        return { basicoMat, basicoLabor, completoMat, completoLabor };
    }, [items, area]);

    const { totalServico, execucaoPrevista, mo: moPreview, mat: matPreview } = calculateItemValues(formItem);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" onClick={onBack} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Voltar ao Simulador
                </Button>
                <div className="flex items-center gap-4">
                    <div className="text-sm">
                        <span className="text-muted-foreground">Área Base:</span>
                        <Badge variant="outline" className="ml-2 font-mono">{area} m²</Badge>
                    </div>
                    <Button
                        onClick={() => {
                            onApply(totals.basicoMat, totals.basicoLabor, totals.completoMat, totals.completoLabor);
                        }}
                        className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-md gap-2"
                    >
                        <CheckCircle2 className="w-4 h-4" /> Aplicar aos Planos
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6">

                {/* ── Esquerda: Criação de Item ── */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="border-secondary/20 shadow-md">
                        <CardHeader className="bg-secondary/5 border-b border-border/40 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Factory className="w-5 h-5 text-secondary" />
                                {editingId ? "Editar Composição" : "Nova Composição"}
                            </CardTitle>
                            <CardDescription>
                                Cadastre os insumos e taxas para gerar o custo exato de material e mão de obra.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">1. Nome do Item (ex: Pintura)</label>
                                <Input
                                    value={formItem.nome}
                                    onChange={e => setFormItem(f => ({ ...f, nome: e.target.value }))}
                                    placeholder="Ex: Pintura látex" className="border-border/50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">2. Índice Sinapi</label>
                                    <Input
                                        type="number" step="0.01" value={formItem.indiceSinapi}
                                        onChange={e => setFormItem(f => ({ ...f, indiceSinapi: e.target.value }))}
                                        placeholder="Ex: 3" className="border-border/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-muted-foreground line-clamp-1 truncate" title="3. Total Serviço (m²)">
                                        3. Total Serviço (m²) <span className="text-[10px] uppercase ml-1">Automático</span>
                                    </label>
                                    <div className="h-10 flex items-center px-3 rounded-md bg-muted/50 font-mono text-sm border border-border/30">
                                        {totalServico.toFixed(2)} m²
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">4. Probabilidade (%)</label>
                                    <Input
                                        type="number" step="0.1" value={formItem.probabilidade}
                                        onChange={e => setFormItem(f => ({ ...f, probabilidade: e.target.value }))}
                                        placeholder="Ex: 50" className="border-border/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-muted-foreground line-clamp-1 truncate" title="5. Execução (m²)">
                                        5. Execução (m²) <span className="text-[10px] uppercase ml-1">Automático</span>
                                    </label>
                                    <div className="h-10 flex items-center px-3 rounded-md bg-muted/50 font-mono text-sm border border-border/30">
                                        {execucaoPrevista.toFixed(2)} m²
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">6. Rendimento (p/ m²)</label>
                                    <Input
                                        type="number" step="0.01" value={formItem.rendimento}
                                        onChange={e => setFormItem(f => ({ ...f, rendimento: e.target.value }))}
                                        placeholder="Ex: 10" className="border-border/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">7. Vlr. Referência (R$)</label>
                                    <div className="relative">
                                        <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            type="number" step="0.01" value={formItem.valorReferencia}
                                            onChange={e => setFormItem(f => ({ ...f, valorReferencia: e.target.value }))}
                                            placeholder="Ex: 100" className="pl-9 border-border/50"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border/30 mt-4 grid grid-cols-2 gap-4">
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold mb-1">
                                        <Hammer className="w-4 h-4" /> <span>Mão de Obra</span>
                                    </div>
                                    <div className="font-mono font-black text-xl text-emerald-700 dark:text-emerald-300">
                                        R$ {moPreview.toFixed(2)}
                                    </div>
                                    <div className="text-[10px] mt-1 text-emerald-600/70">Reflete 57% do total</div>
                                </div>
                                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                                    <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold mb-1">
                                        <Box className="w-4 h-4" /> <span>Material</span>
                                    </div>
                                    <div className="font-mono font-black text-xl text-rose-700 dark:text-rose-300">
                                        R$ {matPreview.toFixed(2)}
                                    </div>
                                    <div className="text-[10px] mt-1 text-rose-600/70">Reflete 43% do total</div>
                                </div>
                            </div>

                            <Button onClick={handleSaveItem} className="w-full mt-4 gap-2">
                                {editingId ? <><Save className="w-4 h-4" />Atualizar Item</> : <><Plus className="w-4 h-4" />Adicionar Item</>}
                            </Button>
                            {editingId && (
                                <Button variant="ghost" onClick={() => { setEditingId(null); setFormItem(emptyItem); }} className="w-full mt-2">
                                    Cancelar Edição
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Direita: Listagem e Planos ── */}
                <div className="lg:col-span-7 space-y-6">

                    {/* Itens Cadastrados (Gavetas) */}
                    <Card className="border-border/50">
                        <CardHeader className="pb-3 border-b border-border/30">
                            <CardTitle className="text-base flex justify-between items-center">
                                Relatório de Insumos
                                <Badge variant="secondary">{items.length} itens</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3 max-h-[300px] overflow-y-auto">
                            {items.length === 0 ? (
                                <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-xl">
                                    Nenhum item cadastrado. Crie o primeiro ao lado.
                                </div>
                            ) : (
                                items.map(item => {
                                    const { mo, mat } = calculateItemValues(item);
                                    return (
                                        <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-center justify-between p-3 rounded-lg border border-border/40 bg-background/50 hover:bg-background/80 transition-colors group">
                                            <div className="flex-1 min-w-0 w-full">
                                                <div className="font-bold text-sm truncate">{item.nome}</div>
                                                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Hammer className="w-3 h-3 text-emerald-500" /> R$ {mo.toFixed(2)}
                                                        <span className="text-[10px] opacity-60 ml-0.5">(R$ {(area > 0 ? mo / area : 0).toFixed(2)}/m²)</span>
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Box className="w-3 h-3 text-rose-500" /> R$ {mat.toFixed(2)}
                                                        <span className="text-[10px] opacity-60 ml-0.5">(R$ {(area > 0 ? mat / area : 0).toFixed(2)}/m²)</span>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" onClick={() => handleEditItem(item)} className="h-8 w-8 text-blue-500">
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => handleRemoveItem(item.id)} className="h-8 w-8 text-rose-500">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>

                    {/* Checklists por Plano */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* PLANO BÁSICO */}
                        <Card className="border-blue-500/30 bg-blue-500/5">
                            <CardHeader className="pb-2 border-b border-blue-500/10">
                                <CardTitle className="text-sm font-extrabold text-blue-500 flex justify-between items-center">
                                    PLANO BÁSICO
                                    <span className="font-mono text-xs text-foreground bg-background px-2 py-0.5 rounded shadow-sm border">
                                        R$ {(totals.basicoMat + totals.basicoLabor).toFixed(2)}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-3 space-y-2">
                                {items.length === 0 && <span className="text-xs text-muted-foreground">Adicione itens para compor este plano.</span>}
                                {items.map(item => (
                                    <label key={item.id} className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors ${item.inBasico ? "border-blue-500/50 bg-blue-500/10" : "border-transparent hover:bg-black/5 dark:hover:bg-white/5"}`}>
                                        <Checkbox
                                            checked={item.inBasico}
                                            onCheckedChange={() => togglePlan(item.id, "inBasico")}
                                            className="mt-0.5"
                                        />
                                        <div className="text-sm leading-tight select-none">
                                            <span className={item.inBasico ? "font-semibold" : "text-muted-foreground"}>{item.nome}</span>
                                        </div>
                                    </label>
                                ))}
                            </CardContent>
                        </Card>

                        {/* PLANO COMPLETO */}
                        <Card className="border-secondary/30 bg-secondary/5">
                            <CardHeader className="pb-2 border-b border-secondary/10">
                                <CardTitle className="text-sm font-extrabold text-secondary flex justify-between items-center">
                                    PLANO COMPLETO
                                    <span className="font-mono text-xs text-foreground bg-background px-2 py-0.5 rounded shadow-sm border">
                                        R$ {(totals.completoMat + totals.completoLabor).toFixed(2)}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-3 space-y-2">
                                {items.length === 0 && <span className="text-xs text-muted-foreground">Adicione itens para compor este plano.</span>}
                                {items.map(item => (
                                    <label key={item.id} className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors ${item.inCompleto ? "border-secondary/50 bg-secondary/10" : "border-transparent hover:bg-black/5 dark:hover:bg-white/5"}`}>
                                        <Checkbox
                                            checked={item.inCompleto}
                                            onCheckedChange={() => togglePlan(item.id, "inCompleto")}
                                            className="mt-0.5 data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
                                        />
                                        <div className="text-sm leading-tight select-none">
                                            <span className={item.inCompleto ? "font-semibold" : "text-muted-foreground"}>{item.nome}</span>
                                        </div>
                                    </label>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    );
};

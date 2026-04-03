import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
    ClipboardCheck, CheckCircle2, XCircle, Clock,
    Loader2, Search, Eye, Building2, MapPin,
    Phone, Mail, FileText, Download, ExternalLink,
    Star, Zap, Package, DollarSign, Users, RefreshCw, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

interface ContratoParaAprovacao {
    id: string;
    nome: string;
    email: string;
    telefone: string;
    cpf: string;
    rg: string;
    endereco_rua: string;
    endereco_numero: string;
    endereco_complemento?: string;
    endereco_bairro: string;
    endereco_cidade: string;
    endereco_estado: string;
    endereco_cep: string;
    status_assinatura: string;
    aprovacao_ef?: string;
    motivo_recusa?: string;
    autentique_document_id?: string;
    contrato_locacao_url?: string;
    vistoria_id?: string;
    vistoria_upload_url?: string;
    vistorias?: { relatorio_url: string };
    created_at: string;
    imobiliaria_id: string;
    imobiliaria_nome?: string;
    imovel_area?: number;
    plano_id?: string;
    plano_nome?: string;
    plano_valor_pc?: number;
    plano_parcelas?: number;
    plano_mensalidade?: number;
}

const fmtMoney = (v?: number) => v != null ? `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—";
const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

const planIcon = (id?: string) => {
    if (id === "completo") return <Star className="w-3.5 h-3.5 text-secondary" />;
    if (id === "basico") return <Zap className="w-3.5 h-3.5 text-blue-500" />;
    return <Package className="w-3.5 h-3.5 text-muted-foreground" />;
};

const aprovacaoBadge = (status?: string) => {
    if (status === "aprovado") return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold"><CheckCircle2 className="w-3 h-3 mr-1" />Aprovado</Badge>;
    if (status === "recusado") return <Badge className="bg-red-500/10 text-red-600 border-red-500/20 font-bold"><XCircle className="w-3 h-3 mr-1" />Recusado</Badge>;
    return <Badge className="bg-violet-500/10 text-violet-600 border-violet-500/20 font-bold"><Clock className="w-3 h-3 mr-1" />Aguardando EF</Badge>;
};

// ─── Component ─────────────────────────────────────────────────────────────────
const AprovacaoPage = () => {
    const [contratos, setContratos] = useState<ContratoParaAprovacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("pendente");
    const [selected, setSelected] = useState<ContratoParaAprovacao | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    // Recusa dialog
    const [recusaOpen, setRecusaOpen] = useState(false);
    const [motivoRecusa, setMotivoRecusa] = useState("");
    const [processing, setProcessing] = useState(false);

    const fetchAll = async () => {
        setLoading(true);
        try {
            // Only contracts that are signed (eligible for approval)
            const { data, error } = await supabase
                .from("inquilinos")
                .select(`
                    *,
                    vistorias (
                        relatorio_url
                    )
                `)
                .eq("status_assinatura", "assinado")
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Resolve imobiliaria names
            const { data: profiles } = await supabase
                .from("profiles")
                .select("id, full_name")
                .eq("role", "imobiliaria");

            const imobMap = new Map<string, string>();
            profiles?.forEach(p => imobMap.set(p.id, p.full_name || "Imobiliária"));

            setContratos((data || []).map(c => ({
                ...c,
                imobiliaria_nome: imobMap.get(c.imobiliaria_id) || "Imobiliária",
            })));
        } catch (err) {
            console.error(err);
            toast.error("Erro ao carregar contratos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    // KPIs
    const kpis = useMemo(() => {
        const pendentes = contratos.filter(c => !c.aprovacao_ef || c.aprovacao_ef === "pendente");
        const aprovados = contratos.filter(c => c.aprovacao_ef === "aprovado");
        const recusados = contratos.filter(c => c.aprovacao_ef === "recusado");
        const mrrAprovado = aprovados.reduce((s, c) => s + (c.plano_mensalidade || 0), 0);
        return { total: contratos.length, pendentes: pendentes.length, aprovados: aprovados.length, recusados: recusados.length, mrrAprovado };
    }, [contratos]);

    // Filtered
    const filtered = useMemo(() => {
        return contratos.filter(c => {
            const q = search.toLowerCase();
            const matchSearch = !q || c.nome.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.cpf || "").includes(q);
            const ef = c.aprovacao_ef || "pendente";
            const matchStatus = filterStatus === "todos" || ef === filterStatus;
            return matchSearch && matchStatus;
        });
    }, [contratos, search, filterStatus]);

    // Actions
    const handleAprovar = async (contrato: ContratoParaAprovacao) => {
        setProcessing(true);
        try {
            const { error } = await supabase
                .from("inquilinos")
                .update({ aprovacao_ef: "aprovado" })
                .eq("id", contrato.id);
            if (error) throw error;
            toast.success(`Contrato de ${contrato.nome} aprovado! Cobrança liberada.`);
            setSheetOpen(false);
            fetchAll();
        } catch { toast.error("Erro ao aprovar contrato."); }
        finally { setProcessing(false); }
    };

    const handleRecusar = async () => {
        if (!selected || !motivoRecusa.trim()) return;
        setProcessing(true);
        try {
            const { error } = await supabase
                .from("inquilinos")
                .update({ aprovacao_ef: "recusado", motivo_recusa: motivoRecusa.trim() })
                .eq("id", selected.id);
            if (error) throw error;
            toast.success("Contrato recusado. Imobiliária será notificada.");
            setRecusaOpen(false);
            setSheetOpen(false);
            setMotivoRecusa("");
            fetchAll();
        } catch { toast.error("Erro ao recusar contrato."); }
        finally { setProcessing(false); }
    };

    const statusTabs = [
        { key: "pendente", label: "Aguardando", count: kpis.pendentes },
        { key: "aprovado", label: "Aprovados", count: kpis.aprovados },
        { key: "recusado", label: "Recusados", count: kpis.recusados },
        { key: "todos", label: "Todos", count: kpis.total },
    ];

    return (
        <DashboardLayout role="admin">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-heading font-extrabold text-foreground mb-1">Aprovação de Contratos</h1>
                        <p className="text-muted-foreground text-sm">Contratos assinados aguardando validação da Entrega Facilitada para liberar cobrança.</p>
                    </div>
                    <Button onClick={fetchAll} disabled={loading} variant="outline" className="gap-2 shrink-0">
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Atualizar
                    </Button>
                </header>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-violet-500/20 bg-violet-500/5">
                        <CardContent className="pt-5 pb-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-violet-600">Aguardando</p>
                                <Clock className="w-4 h-4 text-violet-500" />
                            </div>
                            <p className="text-3xl font-extrabold font-mono text-violet-600">{kpis.pendentes}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">para revisar</p>
                        </CardContent>
                    </Card>
                    <Card className="border-emerald-500/20 bg-emerald-500/5">
                        <CardContent className="pt-5 pb-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Aprovados</p>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            </div>
                            <p className="text-3xl font-extrabold font-mono text-emerald-600">{kpis.aprovados}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">com cobrança ativa</p>
                        </CardContent>
                    </Card>
                    <Card className="border-border/50 bg-card/60">
                        <CardContent className="pt-5 pb-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">MRR Aprovado</p>
                                <DollarSign className="w-4 h-4 text-secondary" />
                            </div>
                            <p className="text-2xl font-extrabold font-mono text-secondary">{fmtMoney(kpis.mrrAprovado)}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">mensalidade consolidada</p>
                        </CardContent>
                    </Card>
                    <Card className="border-red-500/20 bg-red-500/5">
                        <CardContent className="pt-5 pb-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-red-600">Recusados</p>
                                <XCircle className="w-4 h-4 text-red-500" />
                            </div>
                            <p className="text-3xl font-extrabold font-mono text-red-600">{kpis.recusados}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">contratos negados</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs + Search */}
                <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                    <div className="flex gap-1 bg-muted/30 p-1 rounded-xl border border-border/30">
                        {statusTabs.map(t => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => setFilterStatus(t.key)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${filterStatus === t.key
                                    ? "bg-background shadow-sm text-foreground border border-border/50"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {t.label}
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${filterStatus === t.key ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground"}`}>
                                    {t.count}
                                </span>
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Buscar por nome, e-mail ou CPF..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                    </div>
                </div>

                {/* Table */}
                <Card className="border-border/50 bg-card/50 shadow-xl overflow-hidden">
                    <CardHeader className="border-b border-border/50 bg-muted/10 py-4">
                        <CardTitle className="text-base">
                            {filtered.length} contrato{filtered.length !== 1 ? "s" : ""} {filterStatus !== "todos" ? `• ${statusTabs.find(t => t.key === filterStatus)?.label}` : ""}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 animate-spin text-secondary" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground">
                                <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                <p className="font-semibold">Nenhum contrato encontrado</p>
                                <p className="text-sm mt-1">
                                    {filterStatus === "pendente" ? "Não há contratos aguardando aprovação no momento." : "Tente ajustar os filtros."}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-[10px] uppercase text-muted-foreground bg-muted/20 border-b border-border/30">
                                        <tr>
                                            <th className="px-5 py-3 font-bold">Cliente</th>
                                            <th className="px-5 py-3 font-bold hidden md:table-cell">Imobiliária</th>
                                            <th className="px-5 py-3 font-bold hidden sm:table-cell">Plano</th>
                                            <th className="px-5 py-3 font-bold hidden lg:table-cell">Mensalidade</th>
                                            <th className="px-5 py-3 font-bold">Status EF</th>
                                            <th className="px-5 py-3 font-bold hidden md:table-cell">Assinado em</th>
                                            <th className="px-5 py-3 font-bold text-right">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                        {filtered.map(c => (
                                            <tr key={c.id} className="hover:bg-muted/5 transition-colors group">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center font-bold text-secondary text-sm shrink-0">
                                                            {c.nome.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-foreground leading-none">{c.nome}</p>
                                                            <p className="text-[11px] text-muted-foreground mt-0.5">{c.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 hidden md:table-cell">
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Building2 className="w-3.5 h-3.5" />
                                                        {c.imobiliaria_nome}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 hidden sm:table-cell">
                                                    {c.plano_nome ? (
                                                        <div className="flex items-center gap-1.5 text-xs font-bold">
                                                            {planIcon(c.plano_id)} {c.plano_nome}
                                                        </div>
                                                    ) : <span className="text-xs text-muted-foreground">—</span>}
                                                </td>
                                                <td className="px-5 py-4 hidden lg:table-cell">
                                                    <span className="font-mono font-bold text-xs">{fmtMoney(c.plano_mensalidade)}</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {aprovacaoBadge(c.aprovacao_ef)}
                                                </td>
                                                <td className="px-5 py-4 hidden md:table-cell text-xs text-muted-foreground">
                                                    {fmtDate(c.created_at)}
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => { setSelected(c); setSheetOpen(true); }}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Detail Sheet ── */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="sm:max-w-lg overflow-y-auto">
                    {selected && (
                        <div className="space-y-6 pt-4">
                            <SheetHeader>
                                <SheetTitle className="text-xl font-extrabold flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center font-bold text-secondary">
                                        {selected.nome.charAt(0).toUpperCase()}
                                    </div>
                                    {selected.nome}
                                </SheetTitle>
                                <SheetDescription className="flex items-center gap-2">
                                    {aprovacaoBadge(selected.aprovacao_ef)}
                                    {selected.plano_nome && (
                                        <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                                            {planIcon(selected.plano_id)} {selected.plano_nome}
                                        </span>
                                    )}
                                </SheetDescription>
                            </SheetHeader>

                            {/* Financial */}
                            {selected.plano_nome && (
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="p-3 rounded-xl border text-center">
                                        <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1">Parcelas</p>
                                        <p className="font-mono font-extrabold text-lg">{selected.plano_parcelas}x</p>
                                    </div>
                                    <div className="p-3 rounded-xl border border-secondary/30 bg-secondary/5 text-center">
                                        <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1">Mensalidade</p>
                                        <p className="font-mono font-extrabold text-lg text-secondary">{fmtMoney(selected.plano_mensalidade)}</p>
                                    </div>
                                    <div className="p-3 rounded-xl border text-center">
                                        <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1">Total</p>
                                        <p className="font-mono font-extrabold text-base">{fmtMoney(selected.plano_valor_pc)}</p>
                                    </div>
                                </div>
                            )}

                            {/* Client Data */}
                            <div className="bg-muted/20 p-4 rounded-xl space-y-2">
                                <div className="flex items-center gap-2 text-sm"><Mail className="w-3.5 h-3.5 text-muted-foreground" />{selected.email}</div>
                                <div className="flex items-center gap-2 text-sm"><Phone className="w-3.5 h-3.5 text-muted-foreground" />{selected.telefone}</div>
                                <div className="text-xs text-muted-foreground">CPF: {selected.cpf} | RG: {selected.rg}</div>
                            </div>

                            {/* Property */}
                            <div className="bg-muted/20 p-4 rounded-xl">
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold">{selected.endereco_rua}, {selected.endereco_numero}</p>
                                        <p className="text-xs text-muted-foreground">{selected.endereco_bairro}, {selected.endereco_cidade} - {selected.endereco_estado}</p>
                                        {selected.imovel_area && <p className="text-xs text-muted-foreground mt-1">Área: <strong>{selected.imovel_area} m²</strong></p>}
                                    </div>
                                </div>
                            </div>

                            {/* Agency */}
                            <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-xl">
                                <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Imobiliária</p>
                                    <p className="text-sm font-bold">{selected.imobiliaria_nome}</p>
                                </div>
                            </div>

                            {/* Documents */}
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Documentos</p>
                                <div className="flex items-center justify-between p-3 border rounded-xl bg-card">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-secondary" />
                                        <p className="text-sm font-bold">Contrato de Locação</p>
                                    </div>
                                    {selected.contrato_locacao_url
                                        ? <Button size="icon" variant="ghost" className="rounded-full h-8 w-8" onClick={() => window.open(selected.contrato_locacao_url, "_blank")}><ExternalLink className="w-4 h-4" /></Button>
                                        : <Badge variant="outline" className="text-[9px]">Não anexado</Badge>}
                                </div>

                                {/* Vistoria */}
                                <div className="flex items-center justify-between p-3 border rounded-xl bg-card hover:border-secondary/40 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-secondary" />
                                        <div>
                                            <p className="text-sm font-bold">Laudo de Vistoria</p>
                                            <p className="text-[10px] text-muted-foreground">{selected.vistoria_id ? "Vinculada da plataforma" : "PDF externo"}</p>
                                        </div>
                                    </div>
                                    {(selected.vistoria_upload_url || selected.vistoria_id)
                                        ? <Button size="icon" variant="ghost" className="rounded-full h-8 w-8" onClick={() => {
                                            // @ts-ignore - Supabase join returns object or array
                                            const relUrl = Array.isArray(selected.vistorias) ? selected.vistorias[0]?.relatorio_url : selected.vistorias?.relatorio_url;
                                            const url = relUrl || selected.vistoria_upload_url;

                                            if (url) window.open(url, "_blank");
                                            else if (selected.vistoria_id) window.open(`/imobiliaria/vistorias/nova?id=${selected.vistoria_id}&view=true`, "_blank");
                                        }}><ExternalLink className="w-4 h-4" /></Button>
                                        : <Badge variant="outline" className="text-[9px]">Não anexado</Badge>}
                                </div>
                                {selected.autentique_document_id && (
                                    <div className="flex items-center justify-between p-3 border border-emerald-500/30 rounded-xl bg-emerald-500/5">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                            <div>
                                                <p className="text-sm font-bold text-emerald-700">Contrato EF Assinado</p>
                                                <p className="text-[10px] text-emerald-600/70">Ver no Autentique</p>
                                            </div>
                                        </div>
                                        <Button size="icon" variant="ghost" className="rounded-full h-8 w-8 text-emerald-500" onClick={() => window.open(`https://app.autentique.com.br/documento/${selected.autentique_document_id}`, "_blank")}>
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Motivo Recusa (read-only) */}
                            {selected.motivo_recusa && (
                                <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                                    <p className="text-xs font-bold text-red-600 mb-1 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Motivo da Recusa</p>
                                    <p className="text-xs text-muted-foreground italic">"{selected.motivo_recusa}"</p>
                                </div>
                            )}

                            <Separator />

                            {/* Action Buttons */}
                            {(!selected.aprovacao_ef || selected.aprovacao_ef === "pendente") && (
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        variant="outline"
                                        className="border-red-500/30 text-red-600 hover:bg-red-500/5 hover:border-red-500/50 gap-2 font-bold"
                                        onClick={() => { setMotivoRecusa(""); setRecusaOpen(true); }}
                                        disabled={processing}
                                    >
                                        <XCircle className="w-4 h-4" /> Recusar
                                    </Button>
                                    <Button
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold shadow-lg shadow-emerald-600/20"
                                        onClick={() => handleAprovar(selected)}
                                        disabled={processing}
                                    >
                                        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        {processing ? "Aprovando..." : "Aprovar"}
                                    </Button>
                                </div>
                            )}

                            {selected.aprovacao_ef === "aprovado" && (
                                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-center">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                    <p className="font-bold text-emerald-700">Contrato Aprovado</p>
                                    <p className="text-xs text-emerald-600/70 mt-1">Cobrança liberada para este cliente.</p>
                                </div>
                            )}

                            <p className="text-[10px] text-muted-foreground text-center">Assinado em {fmtDate(selected.created_at)}</p>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* ── Recusa Dialog ── */}
            <Dialog open={recusaOpen} onOpenChange={open => { if (!processing) setRecusaOpen(open); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <XCircle className="w-5 h-5" /> Recusar Contrato
                        </DialogTitle>
                        <DialogDescription>
                            O contrato de <strong>{selected?.nome}</strong> será marcado como recusado.
                            Informe o motivo para que a imobiliária tome as providências.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Motivo <span className="text-red-500">*</span></label>
                        <Textarea
                            placeholder="Descreva o motivo da recusa..."
                            value={motivoRecusa}
                            onChange={e => setMotivoRecusa(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                        <p className="text-[10px] text-muted-foreground">{motivoRecusa.length}/500 caracteres</p>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setRecusaOpen(false)} disabled={processing}>Cancelar</Button>
                        <Button
                            onClick={handleRecusar}
                            disabled={!motivoRecusa.trim() || processing}
                            className="bg-red-600 hover:bg-red-700 text-white gap-2"
                        >
                            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            {processing ? "Processando..." : "Confirmar Recusa"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default AprovacaoPage;

import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    Users, TrendingUp, DollarSign, FileSignature,
    CheckCircle2, Clock, Search, Eye, RefreshCw,
    Loader2, Phone, Mail, MapPin, FileText,
    Download, ExternalLink, Building2, Package,
    Zap, Star, ShieldCheck, Filter,
    AlertTriangle, ArrowUpRight, CalendarDays, XCircle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

interface ClienteContrato {
    id: string;
    nome: string;
    email: string;
    telefone: string;
    cpf: string;
    rg: string;
    endereco_cep: string;
    endereco_rua: string;
    endereco_numero: string;
    endereco_complemento?: string;
    endereco_bairro: string;
    endereco_cidade: string;
    endereco_estado: string;
    status_assinatura: string;
    autentique_document_id?: string;
    contrato_locacao_url?: string;
    vistoria_id?: string;
    vistoria_upload_url?: string;
    created_at: string;
    imobiliaria_id: string;
    // Plan snapshot fields
    imovel_area?: number;
    plano_id?: string;
    plano_nome?: string;
    plano_valor_pc?: number;
    plano_parcelas?: number;
    plano_mensalidade?: number;
    // Joined imobiliaria
    imobiliaria_nome?: string;
    motivo_recusa?: string;
    aprovacao_ef?: string;
    vistorias?: { relatorio_url: string };
}

const statusBadge = (item: ClienteContrato) => {
    const status = item.status_assinatura;
    const ef = item.aprovacao_ef || 'pendente';

    if (status === "rejeitado" || status === "recusado" || ef === "recusado")
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20 font-bold"><XCircle className="w-3 h-3 mr-1" />Recusado</Badge>;

    if (status === "assinado") {
        if (ef === "aprovado") return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold"><CheckCircle2 className="w-3 h-3 mr-1" />Aprovado</Badge>;
        return <Badge className="bg-violet-500/10 text-violet-600 border-violet-500/20 font-bold"><Clock className="w-3 h-3 mr-1" />Aguardando EF</Badge>;
    }

    return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold"><Clock className="w-3 h-3 mr-1" />Assinatura Pendente</Badge>;
};

const planIcon = (planoId?: string) => {
    if (planoId === "completo") return <Star className="w-4 h-4 text-secondary" />;
    if (planoId === "basico") return <Zap className="w-4 h-4 text-blue-500" />;
    return <Package className="w-4 h-4 text-muted-foreground" />;
};

const planColor = (planoId?: string) => {
    if (planoId === "completo") return "text-secondary";
    if (planoId === "basico") return "text-blue-500";
    return "text-muted-foreground";
};

const fmtMoney = (v?: number) => v != null ? `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—";
const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

// ─── Main Component ────────────────────────────────────────────────────────────
const PlanoGestaoPage = () => {
    const [clientes, setClientes] = useState<ClienteContrato[]>([]);
    const [imobiliarias, setImobiliarias] = useState<{ id: string; nome: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("todos");
    const [filterPlano, setFilterPlano] = useState("todos");
    const [filterImob, setFilterImob] = useState("todos");
    const [filterDate, setFilterDate] = useState("todos");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const [selected, setSelected] = useState<ClienteContrato | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [recusaOpen, setRecusaOpen] = useState(false);
    const [motivoRecusa, setMotivoRecusa] = useState("");
    const [recusando, setRecusando] = useState(false);

    // ── Date range helper ────────────────────────────────────────────────────
    const getDateRange = (): { from: Date | null; to: Date | null } => {
        const now = new Date();
        const startOfDay = (d: Date) => { d.setHours(0, 0, 0, 0); return d; };
        const endOfDay = (d: Date) => { d.setHours(23, 59, 59, 999); return d; };
        if (filterDate === "hoje") return { from: startOfDay(new Date()), to: endOfDay(new Date()) };
        if (filterDate === "ontem") {
            const y = new Date(now); y.setDate(y.getDate() - 1);
            return { from: startOfDay(y), to: endOfDay(new Date(y)) };
        }
        if (filterDate === "7d") return { from: startOfDay(new Date(now.setDate(now.getDate() - 7))), to: endOfDay(new Date()) };
        if (filterDate === "15d") return { from: startOfDay(new Date(now.setDate(now.getDate() - 15))), to: endOfDay(new Date()) };
        if (filterDate === "30d") return { from: startOfDay(new Date(now.setDate(now.getDate() - 30))), to: endOfDay(new Date()) };
        if (filterDate === "custom" && customStart && customEnd) {
            return { from: startOfDay(new Date(customStart + "T00:00:00")), to: endOfDay(new Date(customEnd + "T23:59:59")) };
        }
        return { from: null, to: null };
    };

    const fetchAll = async () => {
        setLoading(true);
        try {
            // Fetch all clients across all agencies
            const { data: clientesData, error } = await supabase
                .from("inquilinos")
                .select(`
                    *,
                    vistorias (
                        relatorio_url
                    )
                `)
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Imobiliarias are profiles with role='imobiliaria'
            const { data: imobData } = await supabase
                .from("profiles")
                .select("id, full_name")
                .eq("role", "imobiliaria");

            // Build lookup: profile.id → name (direct owner)
            // Also: if imobiliaria has members, their imobiliaria_id points to the owner's profile
            const imobMap = new Map<string, string>();
            imobData?.forEach(i => imobMap.set(i.id, i.full_name || "Imobiliária"));
            setImobiliarias(imobData?.map(i => ({ id: i.id, nome: i.full_name || "Imobiliária" })) || []);

            const enriched = (clientesData || []).map(c => ({
                ...c,
                imobiliaria_nome: imobMap.get(c.imobiliaria_id) || "Imobiliária",
            }));
            setClientes(enriched);
        } catch (err) {
            console.error(err);
            toast.error("Erro ao carregar clientes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    // ── Date-filtered base (feeds KPIs + table) ───────────────────────────────────
    const dateFiltered = useMemo(() => {
        const { from, to } = getDateRange();
        if (!from || !to) return clientes;
        return clientes.filter(c => {
            const d = new Date(c.created_at);
            return d >= from && d <= to;
        });
    }, [clientes, filterDate, customStart, customEnd]);

    // ── KPIs (react to date filter) ────────────────────────────────────────────────
    const kpis = useMemo(() => {
        const ativos = dateFiltered.filter(c => c.status_assinatura === "assinado" && c.aprovacao_ef === "aprovado");
        const aguardandoEF = dateFiltered.filter(c => c.status_assinatura === "assinado" && (!c.aprovacao_ef || c.aprovacao_ef === "pendente"));
        const pendentesAssinatura = dateFiltered.filter(c => c.status_assinatura !== "assinado" && c.status_assinatura !== "rejeitado");
        const mrrTotal = ativos.reduce((s, c) => s + (c.plano_mensalidade || 0), 0);
        const totalContratoValue = ativos.reduce((s, c) => s + (c.plano_valor_pc || 0), 0);
        const byPlan: Record<string, number> = {};
        ativos.forEach(c => {
            const pn = c.plano_nome || "Sem plano";
            byPlan[pn] = (byPlan[pn] || 0) + 1;
        });
        return { total: dateFiltered.length, ativos: ativos.length, aguardandoEF: aguardandoEF.length, pendentesAssinatura: pendentesAssinatura.length, mrrTotal, totalContratoValue, byPlan };
    }, [dateFiltered]);

    // ── Filtered list (all filters applied) ─────────────────────────────────────
    const filtered = useMemo(() => {
        return dateFiltered.filter(c => {
            const q = search.toLowerCase();
            const matchSearch = !q || c.nome.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.endereco_rua.toLowerCase().includes(q) || (c.cpf || "").includes(q);
            const matchStatus = filterStatus === "todos" || c.status_assinatura === filterStatus;
            const matchPlano = filterPlano === "todos" || (c.plano_id || "sem") === filterPlano;
            const matchImob = filterImob === "todos" || c.imobiliaria_id === filterImob;
            return matchSearch && matchStatus && matchPlano && matchImob;
        });
    }, [dateFiltered, search, filterStatus, filterPlano, filterImob]);

    // ── Sync Autentique ───────────────────────────────────────────────────────
    const handleSync = async () => {
        setSyncing(true);
        try {
            const pendentes = clientes.filter(c => c.status_assinatura !== "assinado" && c.autentique_document_id);
            if (!pendentes.length) { toast.info("Nenhuma assinatura pendente para sincronizar."); return; }
            const res = await fetch("/api/sync-autentique", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentIds: pendentes.map(c => c.autentique_document_id) })
            });
            const data = await res.json();
            if (data.success) {
                let n = 0;
                for (const s of data.statuses || []) {
                    if (s.status === "assinado" || s.status === "rejeitado") {
                        await supabase.from("inquilinos").update({ status_assinatura: s.status }).eq("autentique_document_id", s.id);
                        n++;
                    }
                }
                if (n > 0) { toast.success(`${n} contrato(s) atualizados!`); fetchAll(); }
                else toast.info("Nenhuma assinatura nova detectada.");
            }
        } catch { toast.error("Erro na sincronização."); }
        finally { setSyncing(false); }
    };

    // ── Recusar plano ───────────────────────────────────────────────────────────
    const handleRecusar = async () => {
        if (!selected || !motivoRecusa.trim()) return;
        setRecusando(true);
        try {
            const { error } = await supabase
                .from("inquilinos")
                .update({ status_assinatura: "recusado", motivo_recusa: motivoRecusa.trim() })
                .eq("id", selected.id);
            if (error) throw error;
            toast.success("Plano recusado e imobiliária notificada.");
            setRecusaOpen(false);
            setSheetOpen(false);
            setMotivoRecusa("");
            fetchAll();
        } catch {
            toast.error("Erro ao recusar o plano.");
        } finally {
            setRecusando(false);
        }
    };

    return (
        <DashboardLayout role="admin">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">

                {/* ── Header ── */}
                <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-heading font-extrabold text-foreground mb-1">Clientes Contratantes</h1>
                        <p className="text-muted-foreground text-sm">Visão consolidada de todos os clientes que contrataram o Entrega Facilitada.</p>
                    </div>
                    <Button onClick={handleSync} disabled={syncing || loading} variant="outline" className="gap-2 shrink-0">
                        <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                        {syncing ? "Sincronizando..." : "Sincronizar Assinaturas"}
                    </Button>
                </header>

                {/* ── Date Filter (top — affects KPIs + table) ── */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Período</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { key: "todos", label: "Todos" },
                            { key: "hoje", label: "Hoje" },
                            { key: "ontem", label: "Ontem" },
                            { key: "7d", label: "7 dias" },
                            { key: "15d", label: "15 dias" },
                            { key: "30d", label: "30 dias" },
                            { key: "custom", label: "Personalizar" },
                        ].map(opt => (
                            <button
                                key={opt.key}
                                type="button"
                                onClick={() => setFilterDate(opt.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${filterDate === opt.key
                                    ? "bg-secondary text-secondary-foreground border-secondary shadow-md shadow-secondary/20"
                                    : "bg-card border-border/50 text-muted-foreground hover:border-secondary/40 hover:text-secondary hover:bg-secondary/5"
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    {filterDate === "custom" && (
                        <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-muted/20 rounded-xl border border-border/40 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <label className="text-xs font-bold text-muted-foreground whitespace-nowrap">De:</label>
                                <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="h-8 text-sm" />
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <label className="text-xs font-bold text-muted-foreground whitespace-nowrap">Até:</label>
                                <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="h-8 text-sm" />
                            </div>
                        </div>
                    )}
                </div>

                {/* ── KPI Cards ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                        <CardContent className="pt-5 pb-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Clientes</p>
                                <Users className="w-4 h-4 text-secondary" />
                            </div>
                            <p className="text-3xl font-extrabold font-mono">{kpis.total}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm">
                        <CardContent className="pt-5 pb-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Ativos (Aprovados)</p>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            </div>
                            <p className="text-3xl font-extrabold font-mono text-emerald-600">{kpis.ativos}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-violet-500/20 bg-violet-500/5 backdrop-blur-sm shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => window.location.href = '/admin/aprovacoes'}>
                        <CardContent className="pt-5 pb-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-violet-600">Aguardando EF</p>
                                <FileSignature className="w-4 h-4 text-violet-500" />
                            </div>
                            <p className="text-3xl font-extrabold font-mono text-violet-600">{kpis.aguardandoEF}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">clique para aprovar</p>
                        </CardContent>
                    </Card>
                    <Card className="border-border/50 bg-card/60 backdrop-blur-sm md:col-span-1">
                        <CardContent className="pt-5 pb-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">MRR Recorrente</p>
                                <TrendingUp className="w-4 h-4 text-secondary" />
                            </div>
                            <p className="text-2xl font-extrabold font-mono text-secondary">{fmtMoney(kpis.mrrTotal)}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">valor mensal agregado</p>
                        </CardContent>
                    </Card>
                    <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                        <CardContent className="pt-5 pb-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Carteira Total</p>
                                <DollarSign className="w-4 h-4 text-violet-500" />
                            </div>
                            <p className="text-2xl font-extrabold font-mono text-violet-600">{fmtMoney(kpis.totalContratoValue)}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">valor contratual somado</p>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Plan Breakdown ── */}
                {Object.keys(kpis.byPlan).length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(kpis.byPlan).map(([nome, count]) => (
                            <div key={nome} className="flex items-center gap-3 p-3 bg-card/50 border border-border/40 rounded-xl">
                                {nome.toLowerCase().includes("completo") ? <Star className="w-5 h-5 text-secondary shrink-0" /> : <Zap className="w-5 h-5 text-blue-500 shrink-0" />}
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground">{nome}</p>
                                    <p className="text-xl font-extrabold font-mono">{count} <span className="text-xs font-normal text-muted-foreground">cliente{count !== 1 ? 's' : ''}</span></p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Separator />


                {/* ── Search & Other Filters ── */}
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome, e-mail, CPF ou endereço..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full md:w-44">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos os Status</SelectItem>
                            <SelectItem value="assinado">Assinado</SelectItem>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="rejeitado">Rejeitado</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filterPlano} onValueChange={setFilterPlano}>
                        <SelectTrigger className="w-full md:w-44">
                            <SelectValue placeholder="Plano" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos os Planos</SelectItem>
                            <SelectItem value="basico">Plano Básico</SelectItem>
                            <SelectItem value="completo">Plano Completo</SelectItem>
                            <SelectItem value="sem">Sem Plano</SelectItem>
                        </SelectContent>
                    </Select>
                    {imobiliarias.length > 0 && (
                        <Select value={filterImob} onValueChange={setFilterImob}>
                            <SelectTrigger className="w-full md:w-52">
                                <SelectValue placeholder="Imobiliária" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todas as Imobiliárias</SelectItem>
                                {imobiliarias.map(i => (
                                    <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {/* ── Table ── */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl overflow-hidden">
                    <CardHeader className="border-b border-border/50 bg-muted/10 py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">
                                Contratos ({filtered.length}{filtered.length !== clientes.length ? ` de ${clientes.length}` : ""})
                            </CardTitle>
                            {(search || filterStatus !== "todos" || filterPlano !== "todos" || filterImob !== "todos" || filterDate !== "todos") && (
                                <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground" onClick={() => { setSearch(""); setFilterStatus("todos"); setFilterPlano("todos"); setFilterImob("todos"); setFilterDate("todos"); setCustomStart(""); setCustomEnd(""); }}>
                                    <Filter className="w-3 h-3" /> Limpar filtros
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 animate-spin text-secondary" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground">
                                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                <p className="font-semibold">Nenhum cliente encontrado</p>
                                <p className="text-sm mt-1">Tente ajustar os filtros.</p>
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
                                            <th className="px-5 py-3 font-bold hidden lg:table-cell">Valor Total</th>
                                            <th className="px-5 py-3 font-bold">Status</th>
                                            <th className="px-5 py-3 font-bold hidden md:table-cell">Data</th>
                                            <th className="px-5 py-3 font-bold text-right">Detalhe</th>
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
                                                        <div className={`flex items-center gap-1.5 font-bold text-xs ${planColor(c.plano_id)}`}>
                                                            {planIcon(c.plano_id)}
                                                            {c.plano_nome}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 hidden lg:table-cell">
                                                    <span className="font-mono font-bold text-foreground text-xs">{fmtMoney(c.plano_mensalidade)}</span>
                                                    {c.plano_parcelas && <span className="text-[10px] text-muted-foreground ml-1">/{c.plano_parcelas}x</span>}
                                                </td>
                                                <td className="px-5 py-4 hidden lg:table-cell">
                                                    <span className="font-mono text-xs text-muted-foreground">{fmtMoney(c.plano_valor_pc)}</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {statusBadge(c)}
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
                                <SheetTitle className="text-xl font-extrabold flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center font-bold text-secondary">
                                        {selected.nome.charAt(0).toUpperCase()}
                                    </div>
                                    {selected.nome}
                                </SheetTitle>
                                <SheetDescription className="flex items-center gap-2">
                                    {statusBadge(selected)}
                                    {selected.plano_nome && (
                                        <span className={`flex items-center gap-1 text-xs font-bold ${planColor(selected.plano_id)}`}>
                                            {planIcon(selected.plano_id)} {selected.plano_nome}
                                        </span>
                                    )}
                                </SheetDescription>
                            </SheetHeader>

                            {/* Financial Block */}
                            {selected.plano_nome && (
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="p-3 rounded-xl border border-border/40 bg-background text-center">
                                        <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1">Parcelas</p>
                                        <p className="font-mono font-extrabold text-lg">{selected.plano_parcelas}x</p>
                                    </div>
                                    <div className="p-3 rounded-xl border border-secondary/30 bg-secondary/5 text-center">
                                        <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1">Mensalidade</p>
                                        <p className={`font-mono font-extrabold text-lg ${planColor(selected.plano_id)}`}>{fmtMoney(selected.plano_mensalidade)}</p>
                                    </div>
                                    <div className="p-3 rounded-xl border border-border/40 bg-background text-center">
                                        <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1">Valor Total</p>
                                        <p className="font-mono font-extrabold text-base">{fmtMoney(selected.plano_valor_pc)}</p>
                                    </div>
                                </div>
                            )}

                            {/* Client Data */}
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dados do Cliente</p>
                                <div className="bg-muted/20 p-4 rounded-xl space-y-2">
                                    <div className="flex items-center gap-2 text-sm"><Mail className="w-3.5 h-3.5 text-muted-foreground" />{selected.email}</div>
                                    <div className="flex items-center gap-2 text-sm"><Phone className="w-3.5 h-3.5 text-muted-foreground" />{selected.telefone}</div>
                                    <div className="text-xs text-muted-foreground">CPF: {selected.cpf} | RG: {selected.rg}</div>
                                </div>
                            </div>

                            {/* Property */}
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Imóvel</p>
                                <div className="bg-muted/20 p-4 rounded-xl">
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm font-bold">{selected.endereco_rua}, {selected.endereco_numero}</p>
                                            {selected.endereco_complemento && <p className="text-xs text-muted-foreground">{selected.endereco_complemento}</p>}
                                            <p className="text-xs text-muted-foreground">{selected.endereco_bairro}, {selected.endereco_cidade} - {selected.endereco_estado}</p>
                                            {selected.imovel_area && <p className="text-xs text-muted-foreground mt-1">Área: <strong>{selected.imovel_area} m²</strong></p>}
                                        </div>
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

                            <Separator />

                            {/* Documents */}
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Documentos</p>

                                <div className="flex items-center justify-between p-3 border rounded-xl bg-card hover:border-secondary/40 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-secondary" />
                                        <div>
                                            <p className="text-sm font-bold">Contrato de Locação</p>
                                            <p className="text-[10px] text-muted-foreground">Enviado no onboarding</p>
                                        </div>
                                    </div>
                                    {selected.contrato_locacao_url
                                        ? <Button size="icon" variant="ghost" className="rounded-full h-8 w-8" onClick={() => window.open(selected.contrato_locacao_url, "_blank")}><ExternalLink className="w-4 h-4" /></Button>
                                        : <Badge variant="outline" className="text-[9px]">Não anexado</Badge>}
                                </div>

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

                                {selected.status_assinatura === "assinado" && selected.autentique_document_id && (
                                    <div className="flex items-center justify-between p-3 border border-emerald-500/30 rounded-xl bg-emerald-500/5">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                            <div>
                                                <p className="text-sm font-bold text-emerald-700">Contrato Entrega Facilitada</p>
                                                <p className="text-[10px] text-emerald-600/70">Assinatura eletrônica concluída</p>
                                            </div>
                                        </div>
                                        <Button size="icon" variant="ghost" className="rounded-full h-8 w-8 text-emerald-500" onClick={() => window.open(`https://app.autentique.com.br/documento/${selected.autentique_document_id}`, "_blank")}>
                                            <ArrowUpRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="pt-2 space-y-3">
                                <p className="text-[10px] text-muted-foreground text-center">Contratado em {fmtDate(selected.created_at)}</p>

                                {/* Recusar Plano — admin only */}
                                {selected.motivo_recusa ? (
                                    <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                                        <p className="text-xs font-bold text-red-600 mb-1 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Plano Recusado</p>
                                        <p className="text-xs text-muted-foreground italic">"{selected.motivo_recusa}"</p>
                                    </div>
                                ) : selected.status_assinatura !== "recusado" && (
                                    <Button
                                        variant="outline"
                                        className="w-full border-red-500/30 text-red-600 hover:bg-red-500/5 hover:border-red-500/50 gap-2 font-bold"
                                        onClick={() => { setMotivoRecusa(""); setRecusaOpen(true); }}
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Recusar Plano
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* ── Recusa Dialog ── */}
            <Dialog open={recusaOpen} onOpenChange={open => { if (!recusando) setRecusaOpen(open); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <XCircle className="w-5 h-5" /> Recusar Plano
                        </DialogTitle>
                        <DialogDescription>
                            Esta ação marcará o contrato de <strong>{selected?.nome}</strong> como recusado.
                            Informe o motivo para que a imobiliária responsável possa tomar as providências cabíveis.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Motivo da Recusa <span className="text-red-500">*</span></label>
                        <Textarea
                            placeholder="Descreva o motivo pelo qual este plano está sendo recusado..."
                            value={motivoRecusa}
                            onChange={e => setMotivoRecusa(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                        <p className="text-[10px] text-muted-foreground">{motivoRecusa.length}/500 caracteres</p>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setRecusaOpen(false)} disabled={recusando}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleRecusar}
                            disabled={!motivoRecusa.trim() || recusando}
                            className="bg-red-600 hover:bg-red-700 text-white gap-2"
                        >
                            {recusando ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            {recusando ? "Processando..." : "Confirmar Recusa"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default PlanoGestaoPage;

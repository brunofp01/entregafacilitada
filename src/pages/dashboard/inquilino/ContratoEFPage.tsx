import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ShieldCheck, Clock, AlertTriangle, CheckCircle2, Loader2,
    FileText, FileUp, Home, CreditCard, BadgeCheck, Calendar, Hash,
    AlertCircle, ExternalLink
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";

interface InquilinoData {
    id: string;
    email: string;
    endereco_rua: string;
    endereco_numero: string;
    endereco_complemento: string;
    endereco_bairro: string;
    endereco_cidade: string;
    status_assinatura: string;
    aprovacao_ef: string;
    plano_nome: string;
    plano_mensalidade: number;
    plano_parcelas: number;
    contrato_locacao_url: string;
    vistoria_upload_url: string;
    autentique_document_id?: string;
    created_at: string;
    status_pagamento?: string;
}

type PaymentStatus = "pago" | "pendente" | "vencido";
interface Payment {
    ref: string;
    vencimento: string;
    valor: number;
    status: PaymentStatus;
}

interface StripeInvoice {
    hasPending: boolean;
    status?: string;
    invoiceUrl?: string;
    dueDate?: string;
    amount?: number;
}

const steps = [
    { key: "assinatura", label: "Assinatura do Contrato" },
    { key: "analise", label: "Análise pela Equipe EF" },
    { key: "ativo", label: "Plano Ativo" },
];

const statusMap: Record<PaymentStatus, { label: string; className: string; Icon: React.ElementType }> = {
    pago: { label: "Pago", className: "bg-emerald-500/10 text-emerald-600", Icon: CheckCircle2 },
    pendente: { label: "Pendente", className: "bg-orange-500/10 text-orange-600", Icon: Clock },
    vencido: { label: "Vencido", className: "bg-destructive/10 text-destructive", Icon: AlertCircle },
};

const ContratoEFPage = () => {
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [data, setData] = useState<InquilinoData | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [syncing, setSyncing] = useState(false);
    const [pendingInvoice, setPendingInvoice] = useState<StripeInvoice | null>(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user?.email) return;
                const { data: row } = await supabase
                    .from("inquilinos")
                    .select("*")
                    .eq("email", user.email)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();

                if (row) {
                    setData(row as InquilinoData);

                    // Fetch Pending Invoice (Boleto) from Stripe if approved
                    if (row.aprovacao_ef === 'aprovado' || row.status_pagamento === 'pago') {
                        fetchPendingInvoice(row.email);
                    }

                    // Build simple history (conceptual - just to show the list exists but without buttons)
                    // ... (rest of simple history logic)
                    const adesao = new Date(row.created_at);
                    const list: Payment[] = [];
                    for (let i = 0; i < (row.plano_parcelas || 1); i++) {
                        const venc = new Date(adesao.getFullYear(), adesao.getMonth() + i, 10);
                        const isPast = venc < new Date();
                        list.push({
                            ref: venc.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
                            vencimento: venc.toLocaleDateString("pt-BR"),
                            valor: row.plano_mensalidade,
                            status: isPast ? "pago" : "pendente"
                        });
                    }
                    setPayments(list);
                }
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const fetchPendingInvoice = async (email: string) => {
        try {
            const res = await fetch('/api/get-invoice-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const resData = await res.json();
            if (resData.success) {
                setPendingInvoice(resData);
            }
        } catch (err) {
            console.error("Erro ao buscar fatura:", err);
        }
    };

    // Sincronização automática com Autentique
    useEffect(() => {
        if (!loading && data && data.status_assinatura !== 'assinado' && data.autentique_document_id && !syncing) {
            handleSyncAssinaturas(data.autentique_document_id);
        }
    }, [loading, data?.status_assinatura, data?.autentique_document_id]);

    const handleSyncAssinaturas = async (docId: string) => {
        try {
            setSyncing(true);
            const apiRes = await fetch("/api/sync-autentique", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentIds: [docId] })
            });

            const apiData = await apiRes.json();
            if (apiData.success && apiData.statuses && apiData.statuses.length > 0) {
                const item = apiData.statuses[0];
                if (item.status === 'assinado' || item.status === 'rejeitado') {
                    // Atualiza no banco
                    const { error } = await supabase
                        .from('inquilinos')
                        .update({ status_assinatura: item.status })
                        .eq('autentique_document_id', docId);

                    if (!error) {
                        // Atualiza estado local para refletir na UI sem recarregar
                        setData(prev => prev ? { ...prev, status_assinatura: item.status } : null);
                        if (item.status === 'assinado') {
                            toast.success("Documento assinado detectado! Seu contrato foi atualizado.");
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Erro na sincronização:", err);
        } finally {
            setSyncing(false);
        }
    };

    const handleCheckout = async () => {
        if (!data) return;
        try {
            setCheckoutLoading(true);
            const response = await fetch('/api/stripe-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan_name: data.plano_nome,
                    price_amount: data.plano_mensalidade,
                    customer_email: data.email,
                    inquilino_id: data.id,
                    plano_parcelas: data.plano_parcelas,
                }),
            });
            const resData = await response.json();
            if (resData.url) {
                window.location.href = resData.url;
            } else {
                throw new Error(resData.error || 'Erro ao gerar checkout');
            }
        } catch (error: any) {
            toast.error(error.message || 'Erro ao processar pagamento');
        } finally {
            setCheckoutLoading(false);
        }
    };

    const isAssinaturaPendente = !data || data.status_assinatura !== "assinado";
    const isAnalise = data?.status_assinatura === "assinado" && data?.aprovacao_ef === "pendente";
    const isAtivo = data?.status_assinatura === "assinado" && data?.aprovacao_ef === "aprovado";
    const isRecusado = data?.aprovacao_ef === "recusado";

    const currentStep = isAtivo ? 2 : isAnalise ? 1 : 0;

    const statusConfig = isAtivo
        ? { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-600", Icon: ShieldCheck, label: "Plano Ativo", desc: "Sua cobertura EF está ativa. Você está protegido.", spin: false }
        : isAnalise
            ? { bg: "bg-violet-500/10", border: "border-violet-500/20", text: "text-violet-600", Icon: Loader2, label: "Em Análise", desc: "Sua documentação está em revisão pela equipe Entrega Facilitada.", spin: true }
            : isRecusado
                ? { bg: "bg-destructive/10", border: "border-destructive/20", text: "text-destructive", Icon: AlertTriangle, label: "Reprovado", desc: "Seu contrato foi recusado. Entre em contato com o suporte EF.", spin: false }
                : { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-600", Icon: Clock, label: "Aguardando Assinatura", desc: "Verifique seu e-mail e assine o contrato digitalmente via Autentique.", spin: false };

    if (loading) {
        return (
            <DashboardLayout role="inquilino">
                <div className="flex h-[50vh] items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-secondary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="inquilino">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div>
                    <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">Meu Contrato EF</h1>
                    <p className="text-muted-foreground">Detalhes do seu plano e histórico de pagamentos.</p>
                </div>

                {/* Status Alert */}
                <div className={cn("p-5 rounded-2xl border flex items-start gap-4", statusConfig.bg, statusConfig.border)}>
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", statusConfig.bg)}>
                        <statusConfig.Icon className={cn("w-5 h-5", statusConfig.text, statusConfig.spin && "animate-spin")} />
                    </div>
                    <div>
                        <p className={cn("font-black text-lg", statusConfig.text)}>{statusConfig.label}</p>
                        <p className="text-muted-foreground text-sm mt-1">{statusConfig.desc}</p>
                    </div>
                </div>

                {/* Banner de Cobrança Pendente / Boleto */}
                {pendingInvoice?.hasPending && (
                    <div className="bg-amber-500/10 border-2 border-amber-500/30 p-5 rounded-2xl flex items-center justify-between gap-4 animate-in slide-in-from-top-2">
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                                <AlertTriangle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="font-black text-amber-700 text-lg">⚠️ Pagamento Pendente!</p>
                                <p className="text-amber-800/70 text-sm font-semibold">
                                    Sua fatura de **R$ {pendingInvoice.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** com vencimento em **{pendingInvoice.dueDate}** está disponível.
                                </p>
                            </div>
                        </div>
                        <Button
                            className="bg-amber-600 hover:bg-amber-700 text-white font-black shadow-lg shadow-amber-600/20 px-6"
                            onClick={() => window.open(pendingInvoice.invoiceUrl, '_blank')}
                        >
                            VER BOLETO / PIX
                        </Button>
                    </div>
                )}

                {/* Progress Steps */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="border-b border-border/50 pb-4">
                        <CardTitle className="text-base">Etapas do Contrato</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-0">
                            {steps.map((step, i) => {
                                const done = i < currentStep;
                                const active = i === currentStep;
                                return (
                                    <div key={step.key} className="flex items-center flex-1 last:flex-none">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all font-bold text-xs",
                                                done ? "bg-emerald-500 border-emerald-500 text-white"
                                                    : active ? "bg-secondary border-secondary text-secondary-foreground"
                                                        : "bg-muted border-border text-muted-foreground"
                                            )}>
                                                {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                                            </div>
                                            <span className={cn("text-[10px] font-bold text-center uppercase tracking-wider w-20",
                                                done || active ? "text-foreground" : "text-muted-foreground"
                                            )}>
                                                {step.label}
                                            </span>
                                        </div>
                                        {i < steps.length - 1 && (
                                            <div className={cn("flex-1 h-0.5 mx-1 mb-5", done ? "bg-emerald-500" : "bg-border")} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {data ? (
                    <>
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Plano e Pagamento */}
                            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                                <CardHeader className="border-b border-border/50 bg-secondary/5 pb-4">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <BadgeCheck className="w-4 h-4 text-secondary" /> Plano Contratado
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-5">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2">Plano</p>
                                        <span className="font-black text-secondary uppercase bg-secondary/10 px-3 py-1.5 rounded border border-secondary/20 text-sm">
                                            {data.plano_nome || "—"}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2 flex items-center gap-1">
                                            <CreditCard className="w-3 h-3" /> Condição de Pagamento
                                        </p>
                                        <p className="text-2xl font-black">
                                            {data.plano_parcelas}x{" "}
                                            <span className="text-muted-foreground font-bold text-lg">R$</span>{" "}
                                            {data.plano_mensalidade?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> Data de Adesão
                                        </p>
                                        <p className="font-bold">
                                            {new Date(data.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2 flex items-center gap-1">
                                            <Hash className="w-3 h-3" /> Nº do Contrato
                                        </p>
                                        <p className="font-mono font-bold text-muted-foreground">{data.id.split("-")[0].toUpperCase()}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Imóvel */}
                            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                                <CardHeader className="border-b border-border/50 bg-secondary/5 pb-4">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Home className="w-4 h-4 text-secondary" /> Imóvel Protegido
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                                        <p className="font-bold text-lg leading-snug">
                                            {data.endereco_rua}, {data.endereco_numero}
                                            {data.endereco_complemento && ` - ${data.endereco_complemento}`}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {data.endereco_bairro}, {data.endereco_cidade}
                                        </p>
                                    </div>

                                    <div className="mt-6 space-y-3">
                                        {data.contrato_locacao_url && (
                                            <Button variant="outline" className="w-full justify-start gap-3 h-12 border-border/50 hover:bg-secondary/5 font-bold hover:text-secondary group"
                                                onClick={() => window.open(data.contrato_locacao_url, "_blank")}>
                                                <FileUp className="w-4 h-4 text-secondary" /> Contrato Assinado
                                            </Button>
                                        )}
                                        {data.vistoria_upload_url && (
                                            <Button variant="outline" className="w-full justify-start gap-3 h-12 border-border/50 hover:bg-emerald-500/5 font-bold hover:text-emerald-500 group"
                                                onClick={() => window.open(data.vistoria_upload_url, "_blank")}>
                                                <FileText className="w-4 h-4 text-emerald-500" /> Laudo de Vistoria
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Pagamentos Section - Only visible if Approved */}
                        {isAtivo || data.status_pagamento === 'pago' ? (
                            <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                                <CardHeader className="border-b border-border/50 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <CreditCard className="w-4 h-4 text-secondary" /> Gestão de Pagamentos
                                        </CardTitle>
                                        <CardDescription>Suas cobranças são processadas automaticamente via assinatura.</CardDescription>
                                    </div>
                                    {data.status_pagamento !== 'pago' ? (
                                        <Button
                                            onClick={handleCheckout}
                                            disabled={checkoutLoading}
                                            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-black shadow-xl shadow-secondary/20 h-12 px-8 uppercase"
                                        >
                                            {checkoutLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CreditCard className="w-5 h-5 mr-2" />}
                                            Ativar Minha Proteção Agora
                                        </Button>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {pendingInvoice?.hasPending && (
                                                <Button
                                                    onClick={() => window.open(pendingInvoice.invoiceUrl, '_blank')}
                                                    className="bg-amber-600 hover:bg-amber-700 text-white font-black shadow-lg shadow-amber-600/20"
                                                >
                                                    Pagar Boleto Pendente
                                                </Button>
                                            )}
                                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 h-10 px-4 flex items-center gap-2 font-bold select-none">
                                                <BadgeCheck className="w-5 h-5" /> Assinatura Ativa
                                            </Badge>
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground font-bold">
                                                <tr>
                                                    <th className="px-6 py-3">Referência</th>
                                                    <th className="px-6 py-3">Vencimento</th>
                                                    <th className="px-6 py-3">Valor</th>
                                                    <th className="px-6 py-3 text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {payments.map((p, i) => {
                                                    const st = statusMap[p.status];
                                                    return (
                                                        <tr key={i} className="hover:bg-muted/10 transition-colors group">
                                                            <td className="px-6 py-4 font-medium capitalize">{p.ref}</td>
                                                            <td className="px-6 py-4 text-muted-foreground">{p.vencimento}</td>
                                                            <td className="px-6 py-4 font-mono font-bold text-foreground">
                                                                R$ {p.valor?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase", st.className)}>
                                                                    <st.Icon className="w-3.5 h-3.5" />
                                                                    {st.label}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="p-6 bg-secondary/5 border border-dashed border-border rounded-2xl text-center">
                                <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                                <p className="font-bold text-foreground">Pagamentos Pendentes</p>
                                <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                                    As cobranças do seu plano serão liberadas assim que a equipe EA aprovar sua documentação.
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-12 text-center">
                        <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-bold text-lg mb-2">Nenhum contrato EF encontrado</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                            Não localizamos um contrato ativo vinculado ao seu e-mail.
                        </p>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ContratoEFPage;

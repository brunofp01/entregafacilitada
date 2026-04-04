import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, FileText, CheckCircle2, Clock, AlertCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

interface InquilinoData {
    id: string;
    plano_nome: string;
    plano_mensalidade: number;
    plano_parcelas: number;
    status_assinatura: string;
    aprovacao_ef: string;
}

// Simulated payment records — in a real app these would come from a payments table
type PaymentStatus = "pago" | "pendente" | "vencido";
interface Payment {
    ref: string;
    vencimento: string;
    valor: number;
    status: PaymentStatus;
}

const statusMap: Record<PaymentStatus, { label: string; className: string; Icon: React.ElementType }> = {
    pago: { label: "Pago", className: "bg-emerald-500/10 text-emerald-600", Icon: CheckCircle2 },
    pendente: { label: "Pendente", className: "bg-orange-500/10 text-orange-600", Icon: Clock },
    vencido: { label: "Vencido", className: "bg-destructive/10 text-destructive", Icon: AlertCircle },
};

const PagamentosPage = () => {
    const [loading, setLoading] = useState(true);
    const [inquilino, setInquilino] = useState<InquilinoData | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user?.email) return;
                const { data: row } = await supabase
                    .from("inquilinos")
                    .select("id, plano_nome, plano_mensalidade, plano_parcelas, status_assinatura, aprovacao_ef")
                    .eq("email", user.email)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();

                if (row) {
                    setInquilino(row as InquilinoData);
                    // Build simulated monthly payments based on plano_parcelas
                    const hoje = new Date();
                    const geradas: Payment[] = Array.from({ length: row.plano_parcelas || 0 }, (_, i) => {
                        const venc = new Date(hoje.getFullYear(), hoje.getMonth() - (row.plano_parcelas - 1 - i), 10);
                        const isPast = venc < hoje;
                        const isCurrentMonth = venc.getMonth() === hoje.getMonth() && venc.getFullYear() === hoje.getFullYear();
                        const status: PaymentStatus = isPast && !isCurrentMonth ? "pago" : isCurrentMonth ? "pendente" : "pendente";
                        return {
                            ref: venc.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
                            vencimento: venc.toLocaleDateString("pt-BR"),
                            valor: row.plano_mensalidade,
                            status,
                        };
                    });
                    setPayments(geradas.reverse());
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const isAtivo = inquilino?.status_assinatura === "assinado" && inquilino?.aprovacao_ef === "aprovado";
    const totalPago = payments.filter(p => p.status === "pago").reduce((sum, p) => sum + p.valor, 0);

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
                    <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">Pagamentos</h1>
                    <p className="text-muted-foreground">Acompanhe o histórico de cobranças do seu plano EF.</p>
                </div>

                {inquilino ? (
                    <>
                        {/* Summary Cards */}
                        <div className="grid sm:grid-cols-3 gap-4">
                            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                                <CardContent className="pt-6">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Plano</p>
                                    <p className="font-black text-secondary text-lg uppercase">{inquilino.plano_nome || "—"}</p>
                                </CardContent>
                            </Card>
                            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                                <CardContent className="pt-6">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Mensalidade</p>
                                    <p className="font-black text-2xl">
                                        R$ {inquilino.plano_mensalidade?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                                <CardContent className="pt-6">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Total Pago</p>
                                    <p className="font-black text-2xl text-emerald-600">
                                        R$ {totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Payment History */}
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader className="border-b border-border/50 pb-4 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-secondary" /> Histórico de Faturas
                                    </CardTitle>
                                    <CardDescription>Registro de todas as cobranças do seu plano.</CardDescription>
                                </div>
                                {isAtivo && (
                                    <Button variant="outline" size="sm" className="gap-2 text-xs font-bold border-border/50 hover:text-secondary" disabled>
                                        <ExternalLink className="w-3 h-3" /> 2ª Via <span className="text-muted-foreground">(em breve)</span>
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="p-0">
                                {payments.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground font-bold">
                                                <tr>
                                                    <th className="px-6 py-3">Referência</th>
                                                    <th className="px-6 py-3">Vencimento</th>
                                                    <th className="px-6 py-3">Valor</th>
                                                    <th className="px-6 py-3">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {payments.map((p, i) => {
                                                    const st = statusMap[p.status];
                                                    return (
                                                        <tr key={i} className="hover:bg-muted/20 transition-colors">
                                                            <td className="px-6 py-4 font-medium capitalize">{p.ref}</td>
                                                            <td className="px-6 py-4 text-muted-foreground">{p.vencimento}</td>
                                                            <td className="px-6 py-4 font-mono font-bold">
                                                                R$ {p.valor?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold", st.className)}>
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
                                ) : (
                                    <div className="p-12 text-center">
                                        <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                                        <p className="font-bold text-lg mb-1">Sem registros de pagamento</p>
                                        <p className="text-sm text-muted-foreground">
                                            Quando o plano for ativado, as cobranças aparecerão aqui.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {!isAtivo && (
                            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-sm text-orange-600 font-medium">
                                O histórico completo de pagamentos ficará disponível após a ativação do seu plano EF.
                            </div>
                        )}
                    </>
                ) : (
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-12 text-center">
                        <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-bold text-lg mb-2">Nenhum plano encontrado</h3>
                        <p className="text-sm text-muted-foreground">Nenhum contrato EF vinculado ao seu e-mail.</p>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default PagamentosPage;

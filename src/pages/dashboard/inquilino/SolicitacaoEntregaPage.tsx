import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Loader2, ShieldCheck, Key, CalendarDays, ClipboardCheck,
    Clock, CheckCircle2, AlertTriangle, SendHorizontal, Info,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InquilinoData {
    id: string;
    status_assinatura: string;
    aprovacao_ef: string;
    endereco_rua: string;
    endereco_numero: string;
    endereco_bairro: string;
    endereco_cidade: string;
}

const processSteps = [
    { Icon: CalendarDays, title: "Solicitação", desc: "Você informa a data pretendida de entrega." },
    { Icon: ClipboardCheck, title: "Agendamento", desc: "Nossa equipe agenda a vistoria de saída." },
    { Icon: Key, title: "Entrega das Chaves", desc: "Vistoria realizada e chaves entregues." },
    { Icon: CheckCircle2, title: "Conclusão", desc: "Laudo emitido e processo encerrado." },
];

const SolicitacaoEntregaPage = () => {
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [inquilino, setInquilino] = useState<InquilinoData | null>(null);
    const [form, setForm] = useState({ dataEntrega: "", observacoes: "" });
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user?.email) return;
                const { data: row } = await supabase
                    .from("inquilinos")
                    .select("id, status_assinatura, aprovacao_ef, endereco_rua, endereco_numero, endereco_bairro, endereco_cidade")
                    .eq("email", user.email)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();
                if (row) setInquilino(row as InquilinoData);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const isAtivo = inquilino?.status_assinatura === "assinado" && inquilino?.aprovacao_ef === "aprovado";

    const handleSubmit = async () => {
        if (!form.dataEntrega) {
            toast.error("Informe a data pretendida de entrega do imóvel.");
            return;
        }
        try {
            setSending(true);
            // In a real app this would insert to a `solicitacoes` table
            await new Promise(r => setTimeout(r, 1200)); // simulate async request
            setSubmitted(true);
            toast.success("Solicitação enviada com sucesso! Nossa equipe entrará em contato em breve.");
        } catch {
            toast.error("Erro ao enviar a solicitação. Tente novamente.");
        } finally {
            setSending(false);
        }
    };

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
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div>
                    <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">Solicitação de Entrega</h1>
                    <p className="text-muted-foreground">Inicie o processo de entrega do imóvel com a cobertura EF.</p>
                </div>

                {/* Process Steps */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="border-b border-border/50 pb-4">
                        <CardTitle className="text-base">Como funciona</CardTitle>
                        <CardDescription>Seu processo de entrega é simples e acompanhado pela equipe EF.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid sm:grid-cols-4 gap-4">
                            {processSteps.map((step, i) => (
                                <div key={i} className="flex flex-col items-center text-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                                        <step.Icon className="w-5 h-5 text-secondary" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{step.title}</p>
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Requirements */}
                {!isAtivo && (
                    <div className="p-5 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-start gap-4">
                        <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-orange-700 dark:text-orange-400">Plano não ativo</p>
                            <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
                                A solicitação de entrega só pode ser feita com o plano EF ativo e aprovado. Verifique o status do seu contrato na seção{" "}
                                <a href="/inquilino/contrato" className="underline font-bold hover:opacity-80">Meu Contrato</a>.
                            </p>
                        </div>
                    </div>
                )}

                {isAtivo && inquilino && (
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader className="border-b border-border/50 bg-secondary/5 pb-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-secondary" /> Requisitos atendidos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-5 space-y-2">
                            {[
                                "Plano EF ativo e aprovado",
                                `Imóvel: ${inquilino.endereco_rua}, ${inquilino.endereco_numero} — ${inquilino.endereco_bairro}, ${inquilino.endereco_cidade}`,
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-emerald-600">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    <span className="font-medium">{item}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Form */}
                {submitted ? (
                    <Card className="border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm p-10 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-emerald-600">Solicitação Enviada!</h3>
                                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                                    Nossa equipe analisará sua solicitação e entrará em contato via WhatsApp ou e-mail para confirmar o agendamento da vistoria de saída.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-4 py-2 rounded-full">
                                <Clock className="w-3.5 h-3.5" />
                                Prazo de resposta: até 48h úteis
                            </div>
                        </div>
                    </Card>
                ) : (
                    <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm", !isAtivo && "opacity-50 pointer-events-none")}>
                        <CardHeader className="border-b border-border/50 bg-secondary/5 pb-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Key className="w-4 h-4 text-secondary" /> Formulário de Solicitação
                            </CardTitle>
                            <CardDescription>Preencha os dados e nossa equipe entrará em contato.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="space-y-2">
                                <Label>Data pretendida para entrega do imóvel</Label>
                                <div className="relative">
                                    <CalendarDays className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="date"
                                        className="pl-9"
                                        value={form.dataEntrega}
                                        min={new Date().toISOString().split("T")[0]}
                                        onChange={(e) => setForm({ ...form, dataEntrega: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Observações adicionais <span className="text-muted-foreground">(opcional)</span></Label>
                                <textarea
                                    rows={4}
                                    className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                                    placeholder="Ex: Há necessidade de reparo em X; o imóvel estará disponível a partir das Xh..."
                                    value={form.observacoes}
                                    onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                                />
                            </div>

                            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                Ao enviar, nossa equipe analisará sua solicitação e confirmará o agendamento em até 48h úteis via WhatsApp.
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={sending || !isAtivo}
                                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold shadow-lg shadow-secondary/20 gap-2"
                                >
                                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
                                    Enviar Solicitação
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default SolicitacaoEntregaPage;

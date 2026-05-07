import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Key, Clock, CheckCircle2, XCircle, AlertCircle, Eye, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface SolicitacaoRow {
    id: string;
    inquilino_id: string;
    data_pretendida: string;
    observacoes: string;
    status: string;
    created_at: string;
    inquilinos: {
        nome: string;
        email: string;
        telefone: string;
        endereco_rua: string;
        endereco_numero: string;
    };
}

const SolicitacoesPage = () => {
    const [solicitacoes, setSolicitacoes] = useState<SolicitacaoRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<SolicitacaoRow | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        fetchSolicitacoes();
    }, []);

    const fetchSolicitacoes = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('imobiliaria_id, role')
                .eq('id', user.id)
                .single();

            setUserRole(profile?.role || null);
            const imobiliariaId = profile?.imobiliaria_id || user.id;

            let query = supabase
                .from('solicitacoes_entrega')
                .select(`
                    *,
                    inquilinos (
                        nome,
                        email,
                        telefone,
                        endereco_rua,
                        endereco_numero
                    )
                `)
                .order('created_at', { ascending: false });

            // If imobiliaria, filter by imobiliaria_id
            if (profile?.role === 'imobiliaria' || profile?.role === 'integrante_imobiliaria') {
                query = query.eq('imobiliaria_id', imobiliariaId);
            }

            const { data, error } = await query;

            if (error) throw error;
            setSolicitacoes(data || []);
        } catch (error) {
            console.error("Erro ao buscar solicitações:", error);
            toast.error("Erro ao carregar solicitações.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('solicitacoes_entrega')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;

            // Notify Tenant
            if (selected) {
                let statusMsg = "";
                switch (newStatus) {
                    case 'em_analise': statusMsg = "Sua solicitação de entrega está sendo analisada pela imobiliária."; break;
                    case 'agendada': statusMsg = "A vistoria de saída do seu imóvel foi agendada!"; break;
                    case 'concluida': statusMsg = "Processo concluído! A entrega do imóvel foi finalizada no sistema."; break;
                    case 'cancelada': statusMsg = "Sua solicitação de entrega foi cancelada. Entre em contato para saber mais."; break;
                }

                if (statusMsg) {
                    await supabase.from("notifications").insert({
                        user_id: selected.inquilino_id,
                        title: "Atualização no seu pedido de entrega 🏠",
                        message: statusMsg,
                        type: newStatus === 'concluida' ? 'success' : newStatus === 'cancelada' ? 'error' : 'info',
                        link: "/inquilino"
                    });
                }
            }

            toast.success(`Status atualizado para ${newStatus}`);
            fetchSolicitacoes();
            setIsSheetOpen(false);
        } catch (error) {
            toast.error("Erro ao atualizar status.");
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pendente': return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
            case 'em_analise': return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20"><AlertCircle className="w-3 h-3 mr-1" /> Em Análise</Badge>;
            case 'agendada': return <Badge variant="outline" className="bg-violet-500/10 text-violet-600 border-violet-500/20"><Calendar className="w-3 h-3 mr-1" /> Vistoria Agendada</Badge>;
            case 'concluida': return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Concluída</Badge>;
            case 'cancelada': return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="w-3 h-3 mr-1" /> Cancelada</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <DashboardLayout role={userRole as any || "imobiliaria"}>
            <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2 flex items-center gap-2">
                            <Key className="w-8 h-8 text-secondary" /> Solicitações de Entrega
                        </h1>
                        <p className="text-muted-foreground">Gerencie os pedidos de saída e devolução de chaves dos seus locatários.</p>
                    </div>
                </header>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl overflow-hidden">
                    <CardHeader className="border-b border-border/50 bg-muted/20">
                        <CardTitle className="text-lg">Pedidos Recebidos</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <Loader2 className="w-8 h-8 animate-spin mb-4 text-secondary" />
                                <p>Carregando solicitações...</p>
                            </div>
                        ) : solicitacoes.length === 0 ? (
                            <div className="text-center py-20 px-4">
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Key className="w-8 h-8 text-muted-foreground/50" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Nenhuma solicitação no momento</h3>
                                <p className="text-muted-foreground">Quando um inquilino solicitar a entrega do imóvel, ela aparecerá aqui.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-[10px] md:text-xs text-muted-foreground uppercase bg-muted/30">
                                        <tr>
                                            <th className="px-6 py-4 font-bold text-secondary-foreground/70">Inquilino</th>
                                            <th className="px-6 py-4 font-bold text-secondary-foreground/70">Data Pretendida</th>
                                            <th className="px-6 py-4 font-bold text-secondary-foreground/70">Status</th>
                                            <th className="px-6 py-4 font-bold text-right text-secondary-foreground/70">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {solicitacoes.map((s) => (
                                            <tr key={s.id} className="hover:bg-muted/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-foreground">{s.inquilinos?.nome}</div>
                                                    <div className="text-xs text-muted-foreground">{s.inquilinos?.endereco_rua}, {s.inquilinos?.endereco_numero}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium">{new Date(s.data_pretendida).toLocaleDateString('pt-BR')}</div>
                                                    <div className="text-[10px] text-muted-foreground">Solicitado em: {new Date(s.created_at).toLocaleDateString('pt-BR')}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getStatusBadge(s.status)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="hover:bg-secondary/10 hover:text-secondary rounded-full"
                                                        onClick={() => {
                                                            setSelected(s);
                                                            setIsSheetOpen(true);
                                                        }}
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

                {/* Detalhes da Solicitação Drawer */}
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetContent className="sm:max-w-md overflow-y-auto">
                        {selected && (
                            <div className="space-y-6 pt-4">
                                <SheetHeader>
                                    <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                                        <Key className="w-5 h-5 text-secondary" /> Detalhes da Solicitação
                                    </SheetTitle>
                                    <SheetDescription>
                                        Analise o pedido de entrega do imóvel.
                                    </SheetDescription>
                                </SheetHeader>

                                <div className="space-y-6">
                                    <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                                                <User className="w-4 h-4 text-secondary" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Locatário</p>
                                                <p className="text-lg font-bold">{selected.inquilinos?.nome}</p>
                                                <p className="text-sm text-muted-foreground">{selected.inquilinos?.telefone}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Informações da Saída</p>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="p-3 border rounded-lg bg-background">
                                                <span className="text-[10px] text-muted-foreground font-bold uppercase">Data de Saída Pretendida</span>
                                                <p className="text-lg font-bold text-secondary">{new Date(selected.data_pretendida).toLocaleDateString('pt-BR')}</p>
                                            </div>
                                            <div className="p-3 border rounded-lg bg-background">
                                                <span className="text-[10px] text-muted-foreground font-bold uppercase">Observações do Inquilino</span>
                                                <p className="text-sm text-foreground mt-1">{selected.observacoes || "Nenhuma observação informada."}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ações de Gestão</p>
                                        <div className="grid grid-cols-1 gap-2">
                                            <Button 
                                                variant="outline" 
                                                className="justify-start gap-2 border-blue-500/20 hover:bg-blue-500/10 text-blue-600"
                                                onClick={() => handleUpdateStatus(selected.id, 'em_analise')}
                                                disabled={selected.status === 'em_analise'}
                                            >
                                                <AlertCircle className="w-4 h-4" /> Marcar como Em Análise
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                className="justify-start gap-2 border-violet-500/20 hover:bg-violet-500/10 text-violet-600"
                                                onClick={() => handleUpdateStatus(selected.id, 'agendada')}
                                                disabled={selected.status === 'agendada'}
                                            >
                                                <Calendar className="w-4 h-4" /> Agendar Vistoria de Saída
                                            </Button>
                                            <Button 
                                                className="justify-start gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                                                onClick={() => handleUpdateStatus(selected.id, 'concluida')}
                                                disabled={selected.status === 'concluida'}
                                            >
                                                <CheckCircle2 className="w-4 h-4" /> Concluir Entrega (Baixa no Sistema)
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                className="justify-start gap-2 text-red-500 hover:bg-red-500/10"
                                                onClick={() => handleUpdateStatus(selected.id, 'cancelada')}
                                                disabled={selected.status === 'cancelada'}
                                            >
                                                <XCircle className="w-4 h-4" /> Cancelar Solicitação
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </SheetContent>
                </Sheet>
            </div>
        </DashboardLayout>
    );
};

export default SolicitacoesPage;

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, FileSignature, Wallet, ArrowRight, Eye, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

interface InquilinoRow {
    id: string;
    nome: string;
    email: string;
    telefone: string;
    endereco_rua: string;
    endereco_numero: string;
    endereco_cidade: string;
    endereco_estado: string;
    status_assinatura: string;
    autentique_document_id?: string;
    created_at: string;
}

const InquilinosPage = () => {
    const [inquilinos, setInquilinos] = useState<InquilinoRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInquilinos();
    }, []);

    const fetchInquilinos = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from('profiles').select('imobiliaria_id').eq('id', user.id).single();
            const imobiliariaId = profile?.imobiliaria_id || user.id;

            const { data, error } = await supabase
                .from('inquilinos')
                .select('*')
                .eq('imobiliaria_id', imobiliariaId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInquilinos(data || []);
        } catch (error) {
            console.error("Erro ao buscar inquilinos:", error);
        } finally {
            setLoading(false);
        }
    };

    const [syncing, setSyncing] = useState(false);

    const handleSyncAssinaturas = async () => {
        try {
            setSyncing(true);
            const pendentes = inquilinos.filter(i => i.status_assinatura === 'pendente' && i.autentique_document_id);

            if (pendentes.length === 0) {
                toast.info("Não há contratos pendentes listados hoje para sincronizar.");
                return;
            }

            const idsToCheck = pendentes.map(i => i.autentique_document_id);

            const apiRes = await fetch("/api/sync-autentique", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentIds: idsToCheck })
            });

            const apiData = await apiRes.json();

            if (apiData.success && apiData.statuses) {
                let changedCount = 0;
                for (const item of apiData.statuses) {
                    if (item.status === 'assinado' || item.status === 'rejeitado') {
                        await supabase
                            .from('inquilinos')
                            .update({ status_assinatura: item.status })
                            .eq('autentique_document_id', item.id);
                        changedCount++;
                    }
                }

                if (changedCount > 0) {
                    toast.success(`${changedCount} contrato(s) atualizados magicamente!`);
                    fetchInquilinos();
                } else {
                    toast.info("Nenhuma nova assinatura concluída detectada no momento.");
                }
            } else {
                toast.error("Falha ao comunicar com os servidores do Autentique.");
            }
        } catch (err) {
            toast.error("Erro inesperado na sincronização");
            console.error(err);
        } finally {
            setSyncing(false);
        }
    };

    const getSignatureBadge = (status: string) => {
        if (status === 'assinado') {
            return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Assinado</Badge>;
        }
        return <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/20"><Clock className="w-3 h-3 mr-1" /> Pendente no Autentique</Badge>;
    };

    const getBillingBadge = (statusSig: string) => {
        if (statusSig !== 'assinado') {
            return <Badge variant="outline" className="text-muted-foreground border-border/50">Aguardando Assinatura</Badge>;
        }
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20">Em dia</Badge>;
    };

    return (
        <DashboardLayout role="imobiliaria">
            <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">

                <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">Gestão de Inquilinos</h1>
                        <p className="text-muted-foreground">Acompanhe os contratos, assinaturas e mensalidades do Entrega Facilitada.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={handleSyncAssinaturas} disabled={syncing || loading} className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm transition-all hover:bg-secondary/5">
                            <RefreshCw className={`w-4 h-4 mr-2 text-secondary ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Sincronizando...' : 'Atualizar Assinaturas'}
                        </Button>
                        <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold shadow-lg shadow-secondary/20">
                            <Link to="/imobiliaria/contratar">
                                Novo Contrato <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>
                    </div>
                </header>

                {/* Resumo Opcional */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="font-bold uppercase tracking-wider text-xs">Total na Base</CardDescription>
                            <CardTitle className="text-3xl flex items-center gap-2">
                                <Users className="w-6 h-6 text-secondary" /> {inquilinos.length}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="font-bold uppercase tracking-wider text-xs text-orange-500">Assinaturas Pendentes</CardDescription>
                            <CardTitle className="text-3xl flex items-center gap-2">
                                <FileSignature className="w-6 h-6 text-orange-500" />
                                {inquilinos.filter(i => i.status_assinatura !== 'assinado').length}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="font-bold uppercase tracking-wider text-xs text-emerald-500">Contratos Ativos</CardDescription>
                            <CardTitle className="text-3xl flex items-center gap-2">
                                <Wallet className="w-6 h-6 text-emerald-500" />
                                {inquilinos.filter(i => i.status_assinatura === 'assinado').length}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Tabela de Inquilinos */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden">
                    <CardHeader className="border-b border-border/50 bg-muted/20">
                        <CardTitle className="text-lg">Contratos Recentes</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <Loader2 className="w-8 h-8 animate-spin mb-4 text-secondary" />
                                <p>Carregando carteira de locatários...</p>
                            </div>
                        ) : inquilinos.length === 0 ? (
                            <div className="text-center py-20 px-4">
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-muted-foreground/50" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Sua esteira está vazia</h3>
                                <p className="text-muted-foreground mb-6">Você ainda não processou a contratação de nenhum Inquilino.</p>
                                <Button asChild variant="outline" className="border-secondary/50 text-secondary hover:bg-secondary/10">
                                    <Link to="/imobiliaria/contratar">Contratar Primeiro Serviço</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                                        <tr>
                                            <th className="px-6 py-4 font-bold">Locatário</th>
                                            <th className="px-6 py-4 font-bold">Imóvel Associado</th>
                                            <th className="px-6 py-4 font-bold">Status Assinatura</th>
                                            <th className="px-6 py-4 font-bold">Mensalidades</th>
                                            <th className="px-6 py-4 font-bold text-right">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {inquilinos.map((inquilino) => (
                                            <tr key={inquilino.id} className="hover:bg-muted/10 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-foreground">{inquilino.nome}</div>
                                                    <div className="text-muted-foreground text-xs">{inquilino.telefone}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium">{inquilino.endereco_rua}, {inquilino.endereco_numero}</div>
                                                    <div className="text-muted-foreground text-xs">{inquilino.endereco_cidade} - {inquilino.endereco_estado}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getSignatureBadge(inquilino.status_assinatura)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getBillingBadge(inquilino.status_assinatura)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button variant="ghost" size="icon" className="hover:bg-secondary/10 hover:text-secondary rounded-full" title="Ver Detalhes">
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
        </DashboardLayout>
    );
};

export default InquilinosPage;

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, FileSignature, Wallet, ArrowRight, Eye, CheckCircle2, Clock, RefreshCw, Phone, Mail, MapPin, FileText, Download, ExternalLink, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";

interface InquilinoRow {
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
    contratos_servico_url?: string;
    vistoria_id?: string;
    vistoria_upload_url?: string;
    created_at: string;
}

const InquilinosPage = () => {
    const [inquilinos, setInquilinos] = useState<InquilinoRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInquilino, setSelectedInquilino] = useState<InquilinoRow | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        fetchInquilinos();
    }, []);

    const fetchInquilinos = async () => {
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
    const [hasAutoSynced, setHasAutoSynced] = useState(false);

    useEffect(() => {
        if (!loading && inquilinos.length > 0 && !hasAutoSynced && !syncing) {
            const pendentes = inquilinos.filter(i => i.status_assinatura !== 'assinado' && i.autentique_document_id);
            if (pendentes.length > 0) {
                handleSyncAssinaturas();
                setHasAutoSynced(true);
            }
        }
    }, [loading, inquilinos, hasAutoSynced, syncing]);

    const handleSyncAssinaturas = async () => {
        try {
            setSyncing(true);
            const pendentes = inquilinos.filter(i => i.status_assinatura !== 'assinado' && i.autentique_document_id);

            if (pendentes.length === 0) return;

            const idsToCheck = pendentes.map(i => i.autentique_document_id);

            const apiRes = await fetch("/api/sync-autentique", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentIds: idsToCheck })
            });

            const apiData = await apiRes.json();
            console.log("DADOS RECEBIDOS DA API (apiData):", apiData);

            if (apiData.success && apiData.statuses) {
                let changedCount = 0;
                for (const item of apiData.statuses) {
                    console.log(`Verificando item do sync: ID=${item.id}, Status API=${item.status}`);
                    if (item.error_detail) {
                        console.error(`DETALHE DO ERRO no ID ${item.id}:`, item.error_detail);
                    }
                    if (item.debug_signatures) {
                        console.log(`Documento ${item.id} - Assinaturas no Autentique:`, item.debug_signatures);
                    }

                    if (item.status === 'assinado' || item.status === 'rejeitado') {
                        console.log(`Tentando atualizar no Supabase o inquilino com documento ${item.id} para ${item.status}...`);
                        const { data, error } = await supabase
                            .from('inquilinos')
                            .update({ status_assinatura: item.status })
                            .eq('autentique_document_id', item.id)
                            .select();

                        if (error) {
                            console.error(`ERRO SUPABASE ao atualizar ${item.id}:`, error);
                        } else if (data && data.length > 0) {
                            console.log(`SUCESSO! Inquilino ${data[0].nome} atualizado no banco.`);
                            changedCount++;
                        } else {
                            console.warn(`AVISO: Nenhuma linha alterada para o ID ${item.id}. Verifique se a coluna 'autentique_document_id' no Supabase contém exatamente esse valor e se as permissões RLS de UPDATE foram rodadas.`);
                        }
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

    const handleDeletar = async (id: string) => {
        try {
            const { error } = await supabase.rpc('delete_user_by_id', { user_id: id });
            if (error) throw error;
            toast.success("Inquilino removido com sucesso.");
            setIsSheetOpen(false);
            fetchInquilinos();
        } catch (error) {
            toast.error("Erro ao remover inquilino.");
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
                                    <thead className="text-[10px] md:text-xs text-muted-foreground uppercase bg-muted/30">
                                        <tr>
                                            <th className="px-3 md:px-6 py-4 font-bold text-secondary-foreground/70">Locatário</th>
                                            <th className="px-3 md:px-6 py-4 font-bold text-secondary-foreground/70 hidden sm:table-cell">Imóvel</th>
                                            <th className="px-3 md:px-6 py-4 font-bold text-secondary-foreground/70">Assinatura</th>
                                            <th className="px-3 md:px-6 py-4 font-bold text-secondary-foreground/70 hidden md:table-cell">Mensalidades</th>
                                            <th className="px-3 md:px-6 py-4 font-bold text-right text-secondary-foreground/70">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {inquilinos.map((inquilino) => (
                                            <tr key={inquilino.id} className="hover:bg-muted/5 transition-colors">
                                                <td className="px-3 md:px-6 py-4">
                                                    <div className="font-bold text-foreground text-xs md:text-sm">{inquilino.nome}</div>
                                                    <div className="text-muted-foreground text-[10px] md:text-xs">{inquilino.telefone}</div>
                                                </td>
                                                <td className="px-3 md:px-6 py-4 hidden sm:table-cell">
                                                    <div className="font-medium text-xs md:text-sm">{inquilino.endereco_rua}, {inquilino.endereco_numero}</div>
                                                    <div className="text-muted-foreground text-[10px] md:text-xs">{inquilino.endereco_cidade} - {inquilino.endereco_estado}</div>
                                                </td>
                                                <td className="px-3 md:px-6 py-4 scale-[0.85] origin-left md:scale-100">
                                                    {getSignatureBadge(inquilino.status_assinatura)}
                                                </td>
                                                <td className="px-3 md:px-6 py-4 hidden md:table-cell">
                                                    {getBillingBadge(inquilino.status_assinatura)}
                                                </td>
                                                <td className="px-3 md:px-6 py-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="hover:bg-secondary/10 hover:text-secondary rounded-full"
                                                        title="Ver Detalhes"
                                                        onClick={() => {
                                                            setSelectedInquilino(inquilino);
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

                {/* Detalhes do Inquilino Drawer */}
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetContent className="sm:max-w-md overflow-y-auto">
                        {selectedInquilino && (
                            <div className="space-y-6 pt-4">
                                <SheetHeader>
                                    <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                                        <Users className="w-5 h-5 text-secondary" /> Perfil do Locatário
                                    </SheetTitle>
                                    <SheetDescription>
                                        Dados detalhados e documentos vinculados.
                                    </SheetDescription>
                                </SheetHeader>

                                <div className="space-y-4">
                                    <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                                                <Users className="w-4 h-4 text-secondary" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dados Pessoais</p>
                                                <p className="text-lg font-bold">{selectedInquilino.nome}</p>
                                                <p className="text-sm text-muted-foreground">CPF: {selectedInquilino.cpf} | RG: {selectedInquilino.rg}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm ml-11">
                                            <Mail className="w-3.5 h-3.5 text-muted-foreground" /> {selectedInquilino.email}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm ml-11">
                                            <Phone className="w-3.5 h-3.5 text-muted-foreground" /> {selectedInquilino.telefone}
                                        </div>
                                    </div>

                                    <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                                                <MapPin className="w-4 h-4 text-secondary" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Onde ele mora (Imóvel Alugado)</p>
                                                <p className="text-sm font-bold">{selectedInquilino.endereco_rua}, {selectedInquilino.endereco_numero}</p>
                                                {selectedInquilino.endereco_complemento && <p className="text-xs text-muted-foreground">{selectedInquilino.endereco_complemento}</p>}
                                                <p className="text-xs text-muted-foreground">{selectedInquilino.endereco_bairro}, {selectedInquilino.endereco_cidade} - {selectedInquilino.endereco_estado}</p>
                                                <p className="text-xs text-muted-foreground">CEP: {selectedInquilino.endereco_cep}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status da Garantia</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="p-3 border rounded-lg bg-background flex flex-col gap-1">
                                                <span className="text-[10px] text-muted-foreground font-bold">ASSINATURA</span>
                                                {getSignatureBadge(selectedInquilino.status_assinatura)}
                                            </div>
                                            <div className="p-3 border rounded-lg bg-background flex flex-col gap-1">
                                                <span className="text-[10px] text-muted-foreground font-bold">PAGAMENTO</span>
                                                {getBillingBadge(selectedInquilino.status_assinatura)}
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Documentos do Processo</p>

                                        {/* Contrato Locacao */}
                                        <div className="flex items-center justify-between p-3 border rounded-lg bg-card hover:border-secondary/50 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-5 h-5 text-secondary" />
                                                <div>
                                                    <p className="text-sm font-bold leading-none">Contrato de Locação</p>
                                                    <p className="text-[10px] text-muted-foreground mt-1 tracking-tight">PDF Enviado no Onboarding</p>
                                                </div>
                                            </div>
                                            {selectedInquilino.contrato_locacao_url ? (
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full" onClick={() => window.open(selectedInquilino.contrato_locacao_url, '_blank')}>
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            ) : <Badge variant="outline" className="text-[9px]">Não anexado</Badge>}
                                        </div>

                                        {/* Vistoria */}
                                        <div className="flex items-center justify-between p-3 border rounded-lg bg-card hover:border-secondary/50 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-5 h-5 text-secondary" />
                                                <div>
                                                    <p className="text-sm font-bold leading-none">Laudo de Vistoria</p>
                                                    <p className="text-[10px] text-muted-foreground mt-1 tracking-tight">
                                                        {selectedInquilino.vistoria_id ? 'Vinculada da Plataforma' : 'PDF Enviado no Onboarding'}
                                                    </p>
                                                </div>
                                            </div>
                                            {selectedInquilino.vistoria_upload_url || selectedInquilino.vistoria_id ? (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 rounded-full"
                                                    onClick={() => {
                                                        if (selectedInquilino.vistoria_id) {
                                                            window.open(`/imobiliaria/vistorias/nova?id=${selectedInquilino.vistoria_id}`, '_blank');
                                                        } else {
                                                            window.open(selectedInquilino.vistoria_upload_url, '_blank');
                                                        }
                                                    }}
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                            ) : <Badge variant="outline" className="text-[9px]">Não anexado</Badge>}
                                        </div>

                                        {/* Contrato Servico (Autentique/PDF Padrão) */}
                                        {selectedInquilino.status_assinatura === 'assinado' && (
                                            <div className="flex items-center justify-between p-3 border rounded-lg bg-emerald-500/5 border-emerald-500/20 group">
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                    <div>
                                                        <p className="text-sm font-bold leading-none text-emerald-700">Contrato Entrega Facilitada</p>
                                                        <p className="text-[10px] text-emerald-600/70 mt-1 tracking-tight">Assinatura Eletrônica Concluída</p>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10" onClick={() => window.open(`https://app.autentique.com.br/documento/${selectedInquilino.autentique_document_id}`, '_blank')}>
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <Separator />

                                    {userRole === 'admin' && (
                                        <div className="pt-4">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="outline" className="w-full text-destructive border-destructive/20 hover:bg-destructive/5 hover:text-destructive gap-2 text-xs font-bold uppercase tracking-widest h-11">
                                                        <Trash2 className="w-4 h-4" /> Remover do Sistema
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Isso excluirá permanentemente o registro deste inquilino e desvinculará todos os documentos anexados. Esta ação não pode ser desfeita.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeletar(selectedInquilino.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                            Sim, Remover Inquilino
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </SheetContent>
                </Sheet>
            </div>
        </DashboardLayout>
    );
};

export default InquilinosPage;

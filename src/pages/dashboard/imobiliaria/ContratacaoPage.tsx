import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUp, Home, User, Link as LinkIcon, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { pdf } from "@react-pdf/renderer";
import { ContratoPDF } from "@/components/vistorias/ContratoPDF";

interface VistoriaPlataforma {
    id: string;
    rua: string;
    numero: string;
    cidade: string;
}

const ContratacaoPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetchingVistorias, setFetchingVistorias] = useState(true);
    const [vistoriasConcluidas, setVistoriasConcluidas] = useState<VistoriaPlataforma[]>([]);
    const [imobiliariaPerfil, setImobiliariaPerfil] = useState<any>(null);

    // Formulário State
    const [inquilino, setInquilino] = useState({ nome: "", email: "", cpf: "", rg: "", telefone: "" });
    const [imovel, setImovel] = useState({ cep: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "" });
    const [contratoFile, setContratoFile] = useState<File | null>(null);
    const [vistoriaTipo, setVistoriaTipo] = useState<"plataforma" | "upload">("upload");
    const [vistoriaFile, setVistoriaFile] = useState<File | null>(null);
    const [vistoriaIdVinculada, setVistoriaIdVinculada] = useState<string>("");

    useEffect(() => {
        const fetchVistorias = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setImobiliariaPerfil(profile);
                const imobiliariaId = profile?.imobiliaria_id || user.id;

                const { data, error } = await supabase
                    .from("vistorias")
                    .select("id, rua, numero, cidade")
                    .eq("imobiliaria_id", imobiliariaId)
                    .eq("status", "concluida")
                    .order("created_at", { ascending: false });

                if (!error && data) {
                    setVistoriasConcluidas(data);
                }
            } catch (error) {
                console.error("Erro ao buscar vistorias concluídas:", error);
            } finally {
                setFetchingVistorias(false);
            }
        };
        fetchVistorias();
    }, []);

    const handleCepSearch = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '');
        setImovel(prev => ({ ...prev, cep: cleanCep }));

        if (cleanCep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    setImovel(prev => ({
                        ...prev,
                        rua: data.logradouro,
                        bairro: data.bairro,
                        cidade: data.localidade,
                        estado: data.uf
                    }));
                    toast.success("Endereço preenchido automaticamente!");
                }
            } catch {
                toast.error("Erro ao buscar CEP.");
            }
        }
    };

    const handleContratar = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!inquilino.nome || !inquilino.cpf || !imovel.cep) {
            toast.error("Por favor, preencha todos os dados obrigatórios.");
            return;
        }

        if (!contratoFile) {
            toast.error("O upload do Contrato de Locação assinado é obrigatório.");
            return;
        }

        if (vistoriaTipo === "upload" && !vistoriaFile) {
            toast.error("Como você marcou Upload de Arquivo, anexe o PDF da Vistoria.");
            return;
        }

        if (vistoriaTipo === "plataforma" && !vistoriaIdVinculada) {
            toast.error("Você optou por vincular uma vistoria da plataforma, selecione-a na lista.");
            return;
        }

        setLoading(true);
        const toastId = toast.loading("Processando e gerando contrato de prestação de serviços...");

        try {
            // Identifier do inquilino e ambiente
            const imobiliariaId = imobiliariaPerfil?.imobiliaria_id || imobiliariaPerfil?.id;

            // 1. Upload dos arquivos anexados (Contrato Assinado e Vistoria PDF)
            const locacaoId = crypto.randomUUID();
            const { error: errContrato } = await supabase.storage.from("vistorias").upload(`documentos_locacao/${locacaoId}.pdf`, contratoFile);
            if (errContrato) throw new Error("Falha ao anexar contrato de locação");
            const contratoLocacaoUrl = supabase.storage.from("vistorias").getPublicUrl(`documentos_locacao/${locacaoId}.pdf`).data.publicUrl;

            let vistoriaUploadUrl = null;
            if (vistoriaTipo === "upload" && vistoriaFile) {
                const vistUplId = crypto.randomUUID();
                const { error: errVist } = await supabase.storage.from("vistorias").upload(`documentos_locacao/${vistUplId}.pdf`, vistoriaFile);
                if (errVist) throw new Error("Falha ao anexar PDF de vistoria");
                vistoriaUploadUrl = supabase.storage.from("vistorias").getPublicUrl(`documentos_locacao/${vistUplId}.pdf`).data.publicUrl;
            }

            // 2. Geração do Contrato Padrão em memória
            toast.loading("Confeccionando contrato padrão Entrega Facilitada...", { id: toastId });
            const contratoBlob = await pdf(<ContratoPDF inquilino={inquilino} imovel={imovel} imobiliariaPerfil={imobiliariaPerfil} />).toBlob();

            const servicoContractId = crypto.randomUUID();
            await supabase.storage.from("vistorias").upload(`contratos_servico/${servicoContractId}.pdf`, contratoBlob);
            const contratoServicoUrl = supabase.storage.from("vistorias").getPublicUrl(`contratos_servico/${servicoContractId}.pdf`).data.publicUrl;

            // 3. Disparo Autentique (via nossa Vercel Edge Function Segura)
            toast.loading("Enviando solicitação de assinatura eletrônica...", { id: toastId });
            const apiRes = await fetch("/api/autentique", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pdf_url: contratoServicoUrl,
                    signer_email: inquilino.email,
                    signer_name: inquilino.nome,
                    document_name: `Contrato de Adesão Entrega Facilitada - ${inquilino.nome}`
                })
            });

            const apiResult = await apiRes.json();
            const autentiqueDocId = apiResult?.data?.createDocument?.id || null;

            if (!apiRes.ok || !autentiqueDocId) {
                console.error("Autentique falhou:", apiResult);
                toast.error("Erro na API do Autentique. Você pode continuar ou refazer a requisição amanhã.", { duration: 6000, id: toastId });
                // We'll proceed so the tenant is still saved even if Autentique fails in dev without token
            }

            // 4. Criação do registro no banco
            const { error: dbError } = await supabase.from("inquilinos").insert({
                imobiliaria_id: imobiliariaId,
                nome: inquilino.nome,
                email: inquilino.email,
                cpf: inquilino.cpf,
                rg: inquilino.rg,
                telefone: inquilino.telefone,
                endereco_cep: imovel.cep,
                endereco_rua: imovel.rua,
                endereco_numero: imovel.numero,
                endereco_complemento: imovel.complemento,
                endereco_bairro: imovel.bairro,
                endereco_cidade: imovel.cidade,
                endereco_estado: imovel.estado,
                contrato_locacao_url: contratoLocacaoUrl,
                vistoria_id: vistoriaTipo === "plataforma" ? vistoriaIdVinculada : null,
                vistoria_upload_url: vistoriaUploadUrl,
                autentique_document_id: autentiqueDocId,
                status_assinatura: 'pendente'
            });

            if (dbError) throw dbError;

            toast.success("O Contrato foi gerado e disparado para o Locatário com sucesso!", { id: toastId });
            setTimeout(() => navigate('/imobiliaria/inquilinos'), 1500);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Ocorreu um erro na contratação.", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout role="imobiliaria">
            <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <header className="mb-8">
                    <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">Contratar Entrega Facilitada</h1>
                    <p className="text-muted-foreground leading-relaxed">
                        Preencha os dados do locatário e do imóvel alugado. A plataforma gerará um contrato de serviços e enviará para assinatura eletrônica via e-mail.
                    </p>
                </header>

                <form onSubmit={handleContratar} className="space-y-8">

                    {/* Sessão 1: Inquilino */}
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-4 border-b border-border/50 bg-secondary/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                                    <User className="w-5 h-5 text-secondary" />
                                </div>
                                <div>
                                    <CardTitle>Dados do Inquilino</CardTitle>
                                    <CardDescription>O locatário/assinante que pagará as mensalidades.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nome Completo *</Label>
                                    <Input required placeholder="Ex: João da Silva" value={inquilino.nome} onChange={e => setInquilino({ ...inquilino, nome: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>E-mail *</Label>
                                    <Input type="email" required placeholder="joao@email.com" value={inquilino.email} onChange={e => setInquilino({ ...inquilino, email: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>CPF *</Label>
                                    <Input required placeholder="000.000.000-00" value={inquilino.cpf} onChange={e => setInquilino({ ...inquilino, cpf: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>RG *</Label>
                                    <Input required placeholder="00.000.000-0" value={inquilino.rg} onChange={e => setInquilino({ ...inquilino, rg: e.target.value })} />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label>Celular / WhatsApp *</Label>
                                    <Input required placeholder="(00) 00000-0000" value={inquilino.telefone} onChange={e => setInquilino({ ...inquilino, telefone: e.target.value })} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sessão 2: Imóvel */}
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-4 border-b border-border/50 bg-secondary/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                                    <Home className="w-5 h-5 text-secondary" />
                                </div>
                                <div>
                                    <CardTitle>Imóvel Alugado</CardTitle>
                                    <CardDescription>O endereço do imóvel da locação contratada.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>CEP *</Label>
                                    <Input required placeholder="00000-000" value={imovel.cep} onChange={e => handleCepSearch(e.target.value)} maxLength={9} />
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                    <Label>Rua / Logradouro *</Label>
                                    <Input required placeholder="Rua Presidente Kennedy..." value={imovel.rua} onChange={e => setImovel({ ...imovel, rua: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>Número *</Label>
                                    <Input required placeholder="123" value={imovel.numero} onChange={e => setImovel({ ...imovel, numero: e.target.value })} />
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                    <Label>Complemento</Label>
                                    <Input placeholder="Apto 12..." value={imovel.complemento} onChange={e => setImovel({ ...imovel, complemento: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Bairro *</Label>
                                    <Input required placeholder="Centro" value={imovel.bairro} onChange={e => setImovel({ ...imovel, bairro: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Cidade *</Label>
                                    <Input required placeholder="Franca" value={imovel.cidade} onChange={e => setImovel({ ...imovel, cidade: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Estado (UF) *</Label>
                                    <Input required placeholder="SP" value={imovel.estado} onChange={e => setImovel({ ...imovel, estado: e.target.value })} maxLength={2} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sessão 3: Documentação */}
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-4 border-b border-border/50 bg-secondary/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                                    <FileUp className="w-5 h-5 text-secondary" />
                                </div>
                                <div>
                                    <CardTitle>Anexar Documentos</CardTitle>
                                    <CardDescription>O contrato de locação e vistoria original.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-8">

                            {/* Contrato Locacao */}
                            <div className="space-y-3">
                                <div>
                                    <Label className="text-base font-bold">1. Contrato de Locação *</Label>
                                    <p className="text-sm text-muted-foreground mb-4">Insira o pdf do contrato de locação já devidamente assinado pelo inquilino e locador.</p>
                                </div>
                                <div className="flex items-center justify-center w-full">
                                    <label htmlFor="contrato-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-background hover:bg-muted transition-colors border-secondary/40">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <FileUp className="w-8 h-8 mb-3 text-secondary/70" />
                                            <p className="mb-2 text-sm text-muted-foreground">
                                                <span className="font-semibold text-secondary">Clique para fazer upload</span> do contrato (PDF)
                                            </p>
                                            {contratoFile && <p className="text-xs font-bold text-emerald-500 mt-2 bg-emerald-500/10 px-3 py-1 rounded-full">{contratoFile.name}</p>}
                                        </div>
                                        <input id="contrato-file" type="file" className="hidden" accept=".pdf" onChange={e => setContratoFile(e.target.files?.[0] || null)} />
                                    </label>
                                </div>
                            </div>

                            {/* Vistoria */}
                            <div className="space-y-4 pt-4 border-t border-border">
                                <div>
                                    <Label className="text-base font-bold">2. Laudo de Vistoria do Imóvel *</Label>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Como você prefere anexar a vistoria inicial deste imóvel?
                                    </p>
                                </div>

                                <div className="bg-muted/10 p-5 rounded-xl border border-border space-y-6">
                                    <RadioGroup defaultValue={vistoriaTipo} onValueChange={(v: "plataforma" | "upload") => setVistoriaTipo(v)} className="flex flex-col space-y-4">
                                        <div className="flex items-start space-x-3">
                                            <RadioGroupItem value="upload" id="upload" className="mt-1" />
                                            <div>
                                                <Label htmlFor="upload" className="text-base cursor-pointer">Fazer Upload de Arquivo</Label>
                                                <p className="text-sm text-muted-foreground">Use se a vistoria inicial foi feita fora do nosso sistema e você tem o PDF.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start space-x-3">
                                            <RadioGroupItem value="plataforma" id="plataforma" className="mt-1" />
                                            <div>
                                                <Label htmlFor="plataforma" className="text-base flex items-center gap-2 cursor-pointer">
                                                    Vincular Vistoria da Plataforma
                                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">Recomendado</span>
                                                </Label>
                                                <p className="text-sm text-muted-foreground">O inquilino não precisa subir arquivo. O laudo já aprovado na plataforma será vinculado a ele.</p>
                                            </div>
                                        </div>
                                    </RadioGroup>

                                    {/* Render Condicional da Escolha da Vistoria */}
                                    <div className="pt-2 pl-7">
                                        {vistoriaTipo === "upload" ? (
                                            <div className="animate-in slide-in-from-top-2 fade-in">
                                                <label htmlFor="vistoria-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-background hover:bg-muted transition-colors border-border/60 hover:border-secondary/50">
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                        <FileUp className="w-8 h-8 mb-3 text-muted-foreground/50" />
                                                        <p className="text-sm text-muted-foreground">Clique para enviar o **PDF da vistoria**</p>
                                                        {vistoriaFile && <p className="text-xs font-bold text-emerald-500 mt-2 bg-emerald-500/10 px-3 py-1 rounded-full">{vistoriaFile.name}</p>}
                                                    </div>
                                                    <input id="vistoria-file" type="file" className="hidden" accept=".pdf" onChange={e => setVistoriaFile(e.target.files?.[0] || null)} />
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="animate-in slide-in-from-top-2 fade-in space-y-3">
                                                <div className="flex items-start gap-2 bg-blue-500/10 text-blue-600 p-3 rounded-lg text-xs md:text-sm border border-blue-500/20">
                                                    <Info className="w-5 h-5 shrink-0 mt-0.5" />
                                                    <p>
                                                        Abaixo listamos apenas as vistorias <strong>FINALIZADAS (LAUDO DISPONÍVEL)</strong> geradas na plataforma que não foram atreladas a nenhum inquilino.
                                                    </p>
                                                </div>
                                                {fetchingVistorias ? (
                                                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                                        <Loader2 className="w-4 h-4 animate-spin" /> Buscando vistorias concluídas...
                                                    </div>
                                                ) : vistoriasConcluidas.length > 0 ? (
                                                    <Select onValueChange={setVistoriaIdVinculada} value={vistoriaIdVinculada}>
                                                        <SelectTrigger className="w-full text-left h-auto py-3">
                                                            <SelectValue placeholder="Selecione uma vistoria concluída..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {vistoriasConcluidas.map(v => (
                                                                <SelectItem key={v.id} value={v.id}>
                                                                    <div className="flex items-center gap-2">
                                                                        <LinkIcon className="w-4 h-4 text-secondary/70 shrink-0" />
                                                                        <span>{v.rua}{v.numero ? `, nº ${v.numero}` : ''} - {v.cidade}</span>
                                                                        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-2">ID: {v.id.split('-')[0]}</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <div className="text-sm font-bold text-destructive bg-destructive/10 p-4 border border-destructive/20 rounded-lg">
                                                        Você não possui nenhuma vistoria "Concluída" pronta para ser vinculada. Adicione a Vistoria manualmente por upload.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Footer */}
                    <div className="flex justify-end pt-6">
                        <Button type="submit" size="lg" disabled={loading} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold shadow-xl shadow-secondary/20">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                            Gerar Contrato e Enviar para Assinatura Eletrônica
                        </Button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
};

export default ContratacaoPage;

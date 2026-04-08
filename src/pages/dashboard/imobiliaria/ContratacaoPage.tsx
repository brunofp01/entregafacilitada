import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUp, Home, User, Link as LinkIcon, Loader2, Info, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { ContratoPDF } from "@/components/vistorias/ContratoPDF";
import { FormulaParam, PlanConfig, calcPc, calcPp, sumActive, calculateCompositionTotals } from "@/lib/pricingCalc";
import { Zap, Star, ShieldCheck, Check } from "lucide-react";

interface VistoriaPlataforma {
    id: string;
    rua: string;
    numero: string;
    complemento: string;
    cidade: string;
    metragem?: number;
    tipo?: string;
    created_at?: string;
}

const ContratacaoPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetchingVistorias, setFetchingVistorias] = useState(true);
    const [vistoriasConcluidas, setVistoriasConcluidas] = useState<VistoriaPlataforma[]>([]);
    const [imobiliariaPerfil, setImobiliariaPerfil] = useState<any>(null);
    const [userRole, setUserRole] = useState<string>("imobiliaria");

    // Formulário State
    const [inquilino, setInquilino] = useState({ nome: "", email: "", cpf: "", rg: "", telefone: "" });
    const [imovel, setImovel] = useState({ cep: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "", area: "" });
    const [parametrosGlobais, setParametrosGlobais] = useState<any>(null);
    const [compositionItems, setCompositionItems] = useState<any[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string>("basico");
    const [parcelas, setParcelas] = useState<number>(24);
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
                setUserRole(profile?.role || "imobiliaria");

                // If inquilino, pre-fill data
                if (profile?.role === 'inquilino') {
                    setInquilino(prev => ({
                        ...prev,
                        nome: profile.full_name || "",
                        email: profile.email || ""
                    }));
                    setVistoriaTipo("upload"); // Force upload for inquilinos
                }

                const imobiliariaId = profile?.imobiliaria_id || user.id;

                const { data, error } = await supabase
                    .from("vistorias")
                    .select("id, rua, numero, complemento, cidade, metragem, tipo, created_at")
                    .eq("imobiliaria_id", imobiliariaId)
                    .in("status", ["concluida", "aguardando_aprovacao"])
                    .order("created_at", { ascending: false });

                if (error) {
                    console.error("Erro ao buscar vistorias:", error);
                }

                if (!error && data) {
                    setVistoriasConcluidas(data as VistoriaPlataforma[]);
                }

                const { data: configData } = await supabase.from('pricing_parameters_config').select('*').eq('id', 1).single();
                if (configData) {
                    setParametrosGlobais(configData);
                    if (configData.installments) setParcelas(configData.installments);
                }

                const { data: compData } = await supabase.from('cost_composition_items').select('*').order('created_at', { ascending: true });
                if (compData) {
                    setCompositionItems(compData);
                }
            } catch (error) {
                console.error("Erro ao buscar vistorias concluídas ou configs:", error);
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

        if (!inquilino.nome || !inquilino.cpf || !imovel.cep || !imovel.area) {
            toast.error("Por favor, preencha todos os dados obrigatórios e a metragem do imóvel.");
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
            // 0. Check if we need to create an Auth user (only for Admin/Imobiliaria creating for someone else)
            if (userRole !== 'inquilino' && inquilino.email) {
                try {
                    await fetch('/api/create-sale', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            nome: inquilino.nome,
                            email: inquilino.email,
                            telefone: inquilino.telefone,
                            imobiliaria_id: imobiliariaPerfil?.imobiliaria_id || imobiliariaPerfil?.id
                        })
                    });
                    console.log("Auth check/creation completed via API.");
                } catch (e) {
                    console.warn("Auth creation/check failed, proceeding with DB insert anyway:", e);
                }
            }

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

            // Buscar Template do Banco
            const { data: configData } = await supabase
                .from('pricing_parameters_config')
                .select('contract_template')
                .eq('id', 1)
                .single();

            const pdfGenerator = await import('@react-pdf/renderer');
            const pdf = pdfGenerator.pdf;

            const template = configData?.contract_template;
            const sections = Array.isArray(template) ? template : template?.sections;
            const title = Array.isArray(template) ? undefined : template?.title;

            const contratoBlob = await pdf(
                <ContratoPDF
                    inquilino={inquilino}
                    imovel={imovel}
                    imobiliariaPerfil={imobiliariaPerfil}
                    sections={sections}
                    title={title}
                />
            ).toBlob();

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

            let planoObj = null;
            let finalPc = 0;
            let finalParcelas = 24;

            if (parametrosGlobais && selectedPlanId) {
                const plan: PlanConfig = parametrosGlobais.plans?.find((p: any) => p.id === selectedPlanId);
                if (plan) {
                    planoObj = plan;
                    const areaN = parseFloat(imovel.area) || 0;
                    // RECALCULATE with dynamic composition using centralized logic
                    const { material, labor } = calculateCompositionTotals(compositionItems, areaN, plan.id);

                    const updatedParams = (plan.params || []).map((p: any) => {
                        if (p.id === 'pb1' || p.id === 'pc1') return { ...p, value: material.toFixed(2) };
                        if (p.id === 'pb2' || p.id === 'pc2') return { ...p, value: labor.toFixed(2) };
                        return p;
                    });

                    const pp = calcPp(updatedParams, areaN);
                    const ms = sumActive(parametrosGlobais.ms_params || []);
                    const co = sumActive(parametrosGlobais.co_params || []);
                    finalPc = calcPc(pp, ms, co);
                    finalParcelas = parcelas;
                }
            }

            // 4. Criação do registro no banco com SNAPSHOT do plano
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
                status_assinatura: 'pendente',
                // SNAPSHOT FIELDS
                imovel_area: parseFloat(imovel.area) || 0,
                plano_id: planoObj?.id || null,
                plano_nome: planoObj?.label || null,
                plano_valor_pc: finalPc || 0,
                plano_parcelas: finalParcelas,
                plano_mensalidade: finalPc > 0 ? (finalPc / finalParcelas) : 0
            });

            if (dbError) throw dbError;

            toast.success("O Contrato foi gerado e disparado para o Locatário com sucesso!", { id: toastId });
            setTimeout(() => {
                if (userRole === 'inquilino') {
                    navigate('/inquilino');
                } else {
                    navigate('/imobiliaria/inquilinos');
                }
            }, 1500);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Ocorreu um erro na contratação.", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    // Smart filter: per address, find the most recent vistoria.
    // Only suggest if the most recent is 'entrada' AND within the last 2 months.
    const getSmartSuggestions = (): VistoriaPlataforma[] => {
        const iRua = (imovel.rua || "").toLowerCase().trim();
        const iNum = (imovel.numero || "").trim();
        if (!iRua || !iNum) return [];

        // Filter all vistorias that match the address
        const addressMatches = vistoriasConcluidas.filter(v => {
            const vRua = (v.rua || "").toLowerCase().trim();
            const vNum = (v.numero || "").trim();
            return vRua === iRua && vNum === iNum;
        });

        if (addressMatches.length === 0) return [];

        // Sort by date, most recent first
        const sorted = [...addressMatches].sort((a, b) => {
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });

        // Rule 1: If the most recent vistoria is 'saida', don't suggest any.
        const mostRecent = sorted[0];
        if (mostRecent.tipo === 'saida') return [];

        // Rule 2: Only accept 'entrada' vistorias within 2 months from today.
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

        const validEntradas = sorted.filter(v => {
            if (v.tipo !== 'entrada') return false;
            const vDate = new Date(v.created_at || 0);
            return vDate >= twoMonthsAgo;
        });

        // Rule 3: Return only the most recent valid 'entrada'
        return validEntradas.length > 0 ? [validEntradas[0]] : [];
    };

    const matchingVistorias = getSmartSuggestions();

    const selectedVistoria = vistoriasConcluidas.find(v => v.id === vistoriaIdVinculada);
    const showComplementWarning = selectedVistoria?.complemento && imovel.complemento &&
        selectedVistoria.complemento.toLowerCase().trim() !== imovel.complemento.toLowerCase().trim();

    return (
        <DashboardLayout role={userRole as any}>
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
                                    <Input
                                        required
                                        placeholder="Ex: João da Silva"
                                        value={inquilino.nome}
                                        onChange={e => setInquilino({ ...inquilino, nome: e.target.value })}
                                        disabled={userRole === 'inquilino'}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>E-mail *</Label>
                                    <Input
                                        type="email"
                                        required
                                        placeholder="joao@email.com"
                                        value={inquilino.email}
                                        onChange={e => setInquilino({ ...inquilino, email: e.target.value })}
                                        disabled={userRole === 'inquilino'}
                                    />
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
                                <div className="space-y-2 col-span-2 md:col-span-1">
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

                            {userRole !== 'inquilino' && matchingVistorias.length > 0 && (
                                <div className="mt-6 p-5 border border-amber-500/30 bg-amber-500/10 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-4 shadow-sm">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shrink-0 shadow-md">
                                            <Info className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-amber-600 dark:text-amber-500 tracking-tight">Vistoria Compatível Encontrada!</h4>
                                            <p className="text-sm font-semibold text-amber-700/90 dark:text-amber-400/80 mt-1">A plataforma detectou {matchingVistorias.length} vistoria(s) concluída(s) para o endereço <strong>{imovel.rua}, {imovel.numero}</strong>. Selecione abaixo para vincular automaticamente.</p>
                                        </div>
                                    </div>
                                    <div className="pl-14">
                                        <Select
                                            value={vistoriaTipo === 'plataforma' ? vistoriaIdVinculada : ""}
                                            onValueChange={(val) => {
                                                setVistoriaIdVinculada(val);
                                                setVistoriaTipo('plataforma');
                                                const selectedV = matchingVistorias.find(x => x.id === val);
                                                if (selectedV && selectedV.metragem) {
                                                    setImovel(prev => ({ ...prev, area: String(selectedV.metragem) }));
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="w-full bg-background border-amber-500/40 text-foreground font-bold border-2 focus:ring-amber-500 h-12">
                                                <SelectValue placeholder="Toque para vincular a vistoria correspondente a este endereço..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {matchingVistorias.map(v => (
                                                    <SelectItem key={v.id} value={v.id} className="font-semibold cursor-pointer py-3">
                                                        <div className="flex items-center gap-3">
                                                            <LinkIcon className="w-4 h-4 text-amber-500 shrink-0" />
                                                            <span>Vistoria Validada: {v.complemento ? `${v.rua}, n ${v.numero} - ${v.complemento}` : `${v.rua}, n ${v.numero}`}</span>
                                                            <span className="text-[10px] uppercase font-black text-white bg-amber-500 px-2 py-0.5 rounded-full border border-amber-600/50 shadow-sm ml-2">ID: {v.id.split('-')[0]}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        {showComplementWarning && (
                                            <div className="mt-4 text-xs font-bold leading-relaxed bg-white dark:bg-background border-2 border-red-500/50 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                                                <div className="w-2.5 h-2.5 mt-0.5 rounded-full bg-red-500 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                                                <span><strong>ATENÇÃO:</strong> O complemento informado para este imóvel <strong>({imovel.complemento})</strong> não é exatamente igual ao complemento da vistoria selecionada <strong>({selectedVistoria?.complemento})</strong>. Confirme com atenção se você está usando a vistoria do apartamento correto antes de emitir o contrato!</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {vistoriaTipo === 'plataforma' && vistoriaIdVinculada && matchingVistorias.find(v => v.id === vistoriaIdVinculada) ? (
                                <div className="mt-6 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
                                    <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Parâmetro de Análise</h3>
                                    <div className="space-y-2 max-w-[240px]">
                                        <Label>Metragem Computada (m²)</Label>
                                        <Input
                                            type="number"
                                            value={imovel.area}
                                            readOnly
                                            className="font-mono text-emerald-600 font-bold bg-emerald-50 border-emerald-200 h-11 text-lg dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-500/30"
                                        />
                                        <p className="text-[10px] text-muted-foreground font-semibold mt-1">Preenchido e travado pela vistoria.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-6 pt-4 border-t border-border/50">
                                    <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">Parâmetro de Análise</h3>
                                    <div className="space-y-2 max-w-[240px]">
                                        <Label>Metragem (m²) *</Label>
                                        <Input
                                            type="number"
                                            required
                                            placeholder="Ex: 85"
                                            value={imovel.area}
                                            onChange={e => setImovel({ ...imovel, area: e.target.value })}
                                            className="font-mono text-secondary font-bold bg-secondary/5 border-secondary/30 h-11"
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Sessão 3: Plano Entrega Facilitada */}
                    <Card className={`border-secondary/30 bg-secondary/5 backdrop-blur-sm transition-all duration-500 shadow-xl ${!imovel.area || parseFloat(imovel.area) <= 0 ? 'opacity-60 saturate-50' : 'scale-[1.01]'}`}>
                        <CardHeader className="pb-4 border-b border-secondary/20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground shadow-lg flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle>Plano Entrega Facilitada</CardTitle>
                                    <CardDescription>O valor do plano é ajustado automaticamente baseado na metragem do imóvel.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {!imovel.area || parseFloat(imovel.area) <= 0 ? (
                                <div className="text-center py-6">
                                    <p className="text-muted-foreground font-semibold">Insira primeiramente a <span className="text-secondary uppercase">Metragem (m²)</span> do imóvel acima para gerar o valor da proteção.</p>
                                </div>
                            ) : !parametrosGlobais ? (
                                <div className="flex items-center justify-center py-6 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Calculando cotação em tempo real...</div>
                            ) : (
                                <div className="max-w-2xl mx-auto">
                                    {parametrosGlobais.plans?.filter((p: any) => p.id === 'basico').map((plan: any) => {
                                        // Formules
                                        const areaNumber = parseFloat(imovel.area) || 0;
                                        const pp = calcPp(plan.params || [], areaNumber);
                                        const ms = sumActive(parametrosGlobais.ms_params || []);
                                        const co = sumActive(parametrosGlobais.co_params || []);
                                        const finalPc = calcPc(pp, ms, co);

                                        return (
                                            <div key={plan.id} className="relative rounded-2xl border-2 border-secondary bg-white p-8 transition-all duration-300 shadow-lg text-center">
                                                <div className="absolute top-0 right-0 bg-secondary text-white px-4 py-1 text-xs font-bold rounded-bl-xl shadow-md">
                                                    Plano de Proteção Ativo
                                                </div>

                                                <div className="mb-6">
                                                    <div className="text-sm font-black uppercase tracking-widest text-secondary mb-2">Plano Entrega Facilitada</div>
                                                    <div className="text-4xl md:text-5xl font-extrabold tracking-tighter text-foreground flex items-baseline justify-center gap-1">
                                                        {(() => {
                                                            const { material, labor } = calculateCompositionTotals(compositionItems, areaNumber, plan.id);
                                                            const uParams = (plan.params || []).map((p: any) => {
                                                                if (p.id === 'pb1' || p.id === 'pc1') return { ...p, value: material.toFixed(2) };
                                                                if (p.id === 'pb2' || p.id === 'pc2') return { ...p, value: labor.toFixed(2) };
                                                                return p;
                                                            });
                                                            const pc = calcPc(calcPp(uParams, areaNumber), sumActive(parametrosGlobais.ms_params), sumActive(parametrosGlobais.co_params));
                                                            const valorParcela = pc / parcelas;
                                                            return <>
                                                                <span className="text-xl font-bold">{parcelas}x</span>
                                                                <span className="text-xl font-bold ml-1">R$</span>
                                                                {valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </>;
                                                        })()}
                                                    </div>
                                                </div>

                                                <div className="flex justify-center gap-3 mb-8">
                                                    <Button
                                                        type="button"
                                                        variant={parcelas === 12 ? "default" : "outline"}
                                                        onClick={() => setParcelas(12)}
                                                        className={`h-10 px-6 rounded-full font-bold ${parcelas === 12 ? 'bg-secondary text-secondary-foreground' : ''}`}
                                                    >
                                                        12 Meses
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant={parcelas === 24 ? "default" : "outline"}
                                                        onClick={() => setParcelas(24)}
                                                        className={`h-10 px-6 rounded-full font-bold ${parcelas === 24 ? 'bg-secondary text-secondary-foreground' : ''}`}
                                                    >
                                                        24 Meses
                                                    </Button>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                                                    {(compositionItems || []).filter(item => item.in_basico).map(item => (
                                                        <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/5 border border-secondary/10">
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                            <span className="text-xs font-bold text-foreground/80 leading-tight">{item.nome}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Sessão 4: Documentação */}
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

                            {vistoriaTipo === 'plataforma' && vistoriaIdVinculada && matchingVistorias.find(v => v.id === vistoriaIdVinculada) ? (
                                <div className="mt-8 bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl flex items-start gap-4">
                                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <Label className="text-base font-bold text-emerald-700 dark:text-emerald-400">2. Laudo de Vistoria Integrado via Plataforma</Label>
                                        <p className="text-sm font-semibold text-emerald-600/80 dark:text-emerald-400/80 mt-1">A Vistoria de Plataforma compatível foi selecionada na Sessão 2. O anexo será vinculado automaticamente à vida do contrato. Se você quer mudar, altere na Sessão 2!</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 pt-4 border-t border-border mt-4">
                                    <div>
                                        <Label className="text-base font-bold">2. Laudo de Vistoria do Imóvel *</Label>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Como você prefere anexar a vistoria inicial deste imóvel?
                                        </p>
                                    </div>

                                    <div className="bg-muted/10 p-5 rounded-xl border border-border space-y-6">
                                        <RadioGroup
                                            defaultValue={vistoriaTipo}
                                            onValueChange={(v: "plataforma" | "upload") => setVistoriaTipo(v)}
                                            className="flex flex-col space-y-4"
                                            disabled={userRole === 'inquilino'}
                                        >
                                            <div className="flex items-start space-x-3">
                                                <RadioGroupItem value="upload" id="upload" className="mt-1" />
                                                <div>
                                                    <Label htmlFor="upload" className="text-base cursor-pointer">Fazer Upload de Arquivo Manualmente</Label>
                                                    <p className="text-sm text-muted-foreground">Use se a vistoria já foi feita externamente fora da plataforma e você tem o PDF.</p>
                                                </div>
                                            </div>
                                            {userRole !== 'inquilino' && (
                                                <div className="flex items-start space-x-3">
                                                    <RadioGroupItem value="plataforma" id="plataforma" className="mt-1" />
                                                    <div>
                                                        <Label htmlFor="plataforma" className="text-base flex items-center gap-2 cursor-pointer">
                                                            Vincular a uma Vistoria da Plataforma Existente
                                                        </Label>
                                                        <p className="text-sm text-muted-foreground">Selecione uma vistoria gerada aqui dentro da plataforma para vincular.</p>
                                                    </div>
                                                </div>
                                            )}
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
                            )}
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

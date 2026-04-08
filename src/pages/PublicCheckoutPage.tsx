import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileUp, Home, User, Loader2, ShieldCheck, Check, ArrowRight, ArrowLeft, Lock, Info, CheckCircle2, Zap, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { ContratoPDF } from "@/components/vistorias/ContratoPDF";
import { FormulaParam, PlanConfig, calcPc, calcPp, sumActive } from "@/lib/pricingCalc";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const PublicCheckoutPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [parametrosGlobais, setParametrosGlobais] = useState<any>(null);
    const [compositionItems, setCompositionItems] = useState<any[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string>("basico");
    const [parcelas, setParcelas] = useState<number>(24);

    // Formulário State pre-filled from lead capture
    const [inquilino, setInquilino] = useState({
        nome: sessionStorage.getItem("pending_lead_name") || "",
        email: sessionStorage.getItem("pending_lead_email") || "",
        cpf: "",
        rg: "",
        telefone: sessionStorage.getItem("pending_lead_whatsapp") || ""
    });

    const [imovel, setImovel] = useState({
        cep: "",
        rua: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
        area: sessionStorage.getItem("pending_lead_area") || ""
    });

    const [imobiliariaPerfil, setImobiliariaPerfil] = useState<any>(null);
    const [contratoFile, setContratoFile] = useState<File | null>(null);
    const [vistoriaFile, setVistoriaFile] = useState<File | null>(null);

    useEffect(() => {
        const fetchConfigs = async () => {
            try {
                // Fetch a master imobiliaria (admin) for signatures and ownership
                // Using .limit(1) instead of .single() to avoid 406 error if not found
                const { data: adminData } = await supabase.from('profiles').select('*').eq('role', 'admin').limit(1);

                if (adminData && adminData.length > 0) {
                    setImobiliariaPerfil(adminData[0]);
                } else {
                    // Fallback to any imobiliaria if no admin is defined yet
                    const { data: anyImobiliaria } = await supabase.from('profiles').select('*').eq('role', 'imobiliaria').limit(1);
                    if (anyImobiliaria && anyImobiliaria.length > 0) {
                        setImobiliariaPerfil(anyImobiliaria[0]);
                    }
                }

                const { data: configData } = await supabase.from('pricing_parameters_config').select('*').order('id', { ascending: true }).limit(1);
                if (configData && configData.length > 0) {
                    setParametrosGlobais(configData[0]);
                    if (configData[0].installments) setParcelas(configData[0].installments);
                }

                const { data: compData } = await supabase.from('cost_composition_items').select('*').order('created_at', { ascending: true });
                if (compData) {
                    setCompositionItems(compData);
                }
            } catch (error) {
                console.error("Erro ao buscar configs:", error);
            }
        };
        fetchConfigs();
    }, []);

    const handlePhoneChange = (v: string) => {
        let val = v.replace(/\D/g, "");
        if (val.length > 11) val = val.slice(0, 11);
        if (val.length > 10) val = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
        else if (val.length > 6) val = `(${val.slice(0, 2)}) ${val.slice(2, 6)}-${val.slice(6)}`;
        else if (val.length > 2) val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
        else if (val.length > 0) val = `(${val}`;
        setInquilino({ ...inquilino, telefone: val });
    };

    const handleCpfChange = (v: string) => {
        let val = v.replace(/\D/g, "");
        if (val.length > 11) val = val.slice(0, 11);
        if (val.length > 9) val = `${val.slice(0, 3)}.${val.slice(3, 6)}.${val.slice(6, 9)}-${val.slice(9)}`;
        else if (val.length > 6) val = `${val.slice(0, 3)}.${val.slice(3, 6)}.${val.slice(6)}`;
        else if (val.length > 3) val = `${val.slice(0, 3)}.${val.slice(3)}`;
        setInquilino({ ...inquilino, cpf: val });
    };

    const handleRgChange = (v: string) => {
        let val = v.replace(/\D/g, "");
        if (val.length > 9) val = val.slice(0, 9);
        setInquilino({ ...inquilino, rg: val }); // RG simplicity
    };

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

        if (!inquilino.nome || !inquilino.cpf || !inquilino.email || !imovel.cep || !imovel.area) {
            toast.error("Por favor, preencha todos os dados obrigatórios e a metragem do imóvel.");
            return;
        }

        if (!contratoFile) {
            toast.error("O upload do Contrato de Locação assinado é obrigatório.");
            return;
        }

        if (!vistoriaFile) {
            toast.error("Anexe o PDF da Vistoria Inicial.");
            return;
        }

        setLoading(true);
        const toastId = toast.loading("Processando e gerando contrato de prestação de serviços...");

        const uploadFileSecurely = async (file: File | Blob, path: string) => {
            const res = await fetch("/api/get-upload-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path })
            });
            if (!res.ok) throw new Error("Erro ao preparar upload seguro.");
            const { token } = await res.json();

            const { error } = await supabase.storage.from("vistorias").uploadToSignedUrl(path, token, file);
            if (error) throw error;

            return supabase.storage.from("vistorias").getPublicUrl(path).data.publicUrl;
        };

        try {
            // 1. Upload files securely
            const locacaoId = crypto.randomUUID();
            const contratoLocacaoUrl = await uploadFileSecurely(contratoFile, `documentos_locacao/${locacaoId}.pdf`);

            const vistUplId = crypto.randomUUID();
            const vistoriaUploadUrl = await uploadFileSecurely(vistoriaFile, `documentos_locacao/${vistUplId}.pdf`);

            // 2. Generate PDF and Autentique
            const pdfGenerator = await import('@react-pdf/renderer');
            const pdf = pdfGenerator.pdf;

            // Get template
            const { data: configDataArray } = await supabase.from('pricing_parameters_config').select('contract_template').order('id', { ascending: true }).limit(1);
            const template = configDataArray?.[0]?.contract_template;
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
            const contratoServicoUrl = await uploadFileSecurely(contratoBlob, `contratos_servico/${servicoContractId}.pdf`);

            // 3. Autentique
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

            // 4. Calculate Final Values
            let planoObj = null;
            let finalPc = 0;
            if (parametrosGlobais && selectedPlanId) {
                const plan: PlanConfig = parametrosGlobais.plans?.find((p: any) => p.id === selectedPlanId);
                if (plan) {
                    planoObj = plan;
                    const areaN = parseFloat(imovel.area) || 0;

                    // RECALCULATE with dynamic composition
                    let dynamicMat = 0;
                    let dynamicLabor = 0;
                    compositionItems.forEach(item => {
                        const isInPlan = plan.id === 'basico' ? item.in_basico : item.in_completo;
                        if (isInPlan) {
                            const indice = item.indice_sinapi || 0;
                            const prob = item.probabilidade || 0;
                            const rend = item.rendimento || 1;
                            const ref = item.valor_referencia || 0;
                            const totalServico = areaN * indice;
                            const execucaoPrevista = totalServico * (prob / 100);
                            let mo = rend > 0 ? (execucaoPrevista / rend) * ref * 0.57 : 0;
                            let mat = rend > 0 ? (execucaoPrevista / rend) * ref * 0.43 : 0;
                            if (item.tem_valor_minimo) {
                                const minV = item.valor_minimo || 0;
                                if ((mo + mat) < minV) { mo = minV * 0.57; mat = minV * 0.43; }
                            }
                            dynamicMat += mat; dynamicLabor += mo;
                        }
                    });

                    const updatedParams = (plan.params || []).map((p: any) => {
                        if (p.id === 'pb1' || p.id === 'pc1') return { ...p, value: dynamicMat.toString() };
                        if (p.id === 'pb2' || p.id === 'pc2') return { ...p, value: dynamicLabor.toString() };
                        return p;
                    });

                    const pp = calcPp(updatedParams, areaN);
                    const ms = sumActive(parametrosGlobais.ms_params || []);
                    const co = sumActive(parametrosGlobais.co_params || []);
                    finalPc = calcPc(pp, ms, co);
                }
            }

            // 5. Final Step: Call API to handle User Creation AND Inquilino Record (Bypasses RLS via server-side)
            const response = await fetch('/api/create-sale', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: inquilino.nome,
                    email: inquilino.email,
                    telefone: inquilino.telefone,
                    cpf: inquilino.cpf,
                    rg: inquilino.rg,
                    imobiliaria_id: imobiliariaPerfil?.id || null,
                    imovel_data: {
                        ...imovel,
                        area: imovel.area
                    },
                    contract_data: {
                        contrato_locacao_url: contratoLocacaoUrl,
                        vistoria_upload_url: vistoriaUploadUrl,
                        autentique_document_id: autentiqueDocId,
                        plano_id: planoObj?.id || null,
                        plano_nome: planoObj?.label || null,
                        plano_valor_pc: finalPc || 0,
                        plano_parcelas: parcelas,
                        plano_mensalidade: finalPc > 0 ? (finalPc / parcelas) : 0
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Erro ao processar contratação no servidor.");
            }

            // Store email for SuccessPage
            sessionStorage.setItem("pending_lead_email", inquilino.email);

            toast.success("Contratação iniciada com sucesso!", { id: toastId });
            navigate("/sucesso");

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Erro na contratação.", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-muted/30 pb-20">
            <nav className="bg-white border-b border-border py-4 mb-8">
                <div className="container max-w-4xl flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-primary font-heading font-black text-xl italic uppercase tracking-tighter">
                        <ArrowLeft className="w-5 h-5" />
                        Entrega Facilitada
                    </Link>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest hidden sm:block">
                        Checkout Seguro
                    </div>
                </div>
            </nav>

            <div className="container max-w-4xl">
                <header className="mb-10 text-center">
                    <h1 className="text-3xl md:text-5xl font-heading font-extrabold text-foreground mb-4">Finalizar Contratação</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Quase lá! Complete os dados finais para gerarmos o seu contrato de proteção e garantir sua vistoria aprovada.
                    </p>
                </header>

                <form onSubmit={handleContratar} className="space-y-8">
                    {/* Step 1: Inquilino */}
                    <Card className="border-border/50 bg-card shadow-sm">
                        <CardHeader className="pb-4 border-b border-border/50 bg-muted/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>Seus Dados Pessoais</CardTitle>
                                    <CardDescription>Precisamos dessas informações para o contrato jurídico.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nome Completo *</Label>
                                <Input required value={inquilino.nome} onChange={e => setInquilino({ ...inquilino, nome: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>E-mail *</Label>
                                <Input type="email" required placeholder="seu@email.com" value={inquilino.email} onChange={e => setInquilino({ ...inquilino, email: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>CPF *</Label>
                                <Input required placeholder="000.000.000-00" value={inquilino.cpf} onChange={e => handleCpfChange(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>RG *</Label>
                                <Input required placeholder="000000000" value={inquilino.rg} onChange={e => handleRgChange(e.target.value)} />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label>WhatsApp *</Label>
                                <Input required placeholder="(00) 00000-0000" value={inquilino.telefone} onChange={e => handlePhoneChange(e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Step 2: Imóvel */}
                    <Card className="border-border/50 bg-card shadow-sm">
                        <CardHeader className="pb-4 border-b border-border/50 bg-muted/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Home className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>Endereço do Imóvel</CardTitle>
                                    <CardDescription>Onde realizaremos a restauração na sua desocupação.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>CEP *</Label>
                                    <Input required value={imovel.cep} onChange={e => handleCepSearch(e.target.value)} maxLength={9} />
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                    <Label>Rua / Logradouro *</Label>
                                    <Input required value={imovel.rua} onChange={e => setImovel({ ...imovel, rua: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>Número *</Label>
                                    <Input required value={imovel.numero} onChange={e => setImovel({ ...imovel, numero: e.target.value })} />
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                    <Label>Complemento</Label>
                                    <Input value={imovel.complemento} onChange={e => setImovel({ ...imovel, complemento: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Bairro *</Label>
                                    <Input required value={imovel.bairro} onChange={e => setImovel({ ...imovel, bairro: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Cidade *</Label>
                                    <Input required value={imovel.cidade} onChange={e => setImovel({ ...imovel, cidade: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Label>Metragem (m²) *</Label>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-[200px] text-xs">
                                                    Informe a área útil total do imóvel conforme consta no seu Contrato de Locação. Esta medida define o valor da sua proteção.
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <Input
                                        type="number"
                                        required
                                        value={imovel.area}
                                        onChange={e => setImovel({ ...imovel, area: e.target.value })}
                                        className="font-mono font-black text-lg border-secondary/50 bg-secondary/5 focus:ring-secondary/20"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-6 mb-8 py-4 border-y border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Contratação Segura</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Lock className="w-5 h-5 text-blue-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Privacidade 100% Garantida</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle2 className="w-5 h-5 text-secondary" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Profissionais Homologados</span>
                        </div>
                    </div>

                    {/* Step 3: Plano Único */}
                    <Card className="border-secondary/30 bg-secondary/5 shadow-xl scale-[1.01] transition-all">
                        <CardHeader className="pb-4 border-b border-secondary/20 bg-secondary/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shadow-lg">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle>Plano Entrega Facilitada</CardTitle>
                                    <CardDescription>Proteção completa para a sua vistoria de saída.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {!imovel.area || parseFloat(imovel.area) <= 0 ? (
                                <div className="text-center py-6">
                                    <p className="text-muted-foreground font-semibold">Insira a <span className="text-secondary uppercase">Metragem</span> acima para visualizar sua proposta.</p>
                                </div>
                            ) : !parametrosGlobais ? (
                                <div className="flex items-center justify-center py-6 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Calculando cotação...</div>
                            ) : (
                                <div className="max-w-md mx-auto">
                                    {parametrosGlobais.plans?.filter((p: any) => p.id === 'basico').map((plan: any) => {
                                        // FORMULA SYNC
                                        const areaNumber = parseFloat(imovel.area) || 0;
                                        let dMat = 0; let dLabor = 0;
                                        compositionItems.forEach(item => {
                                            if (item.in_basico) {
                                                const totalServico = areaNumber * (item.indice_sinapi || 0);
                                                const exec = totalServico * ((item.probabilidade || 0) / 100);
                                                let mo = (item.rendimento || 1) > 0 ? (exec / item.rendimento) * (item.valor_referencia || 0) * 0.57 : 0;
                                                let mat = (item.rendimento || 1) > 0 ? (exec / item.rendimento) * (item.valor_referencia || 0) * 0.43 : 0;
                                                if (item.tem_valor_minimo && (mo + mat) < (item.valor_minimo || 0)) { mo = (item.valor_minimo || 0) * 0.57; mat = (item.valor_minimo || 0) * 0.43; }
                                                dMat += mat; dLabor += mo;
                                            }
                                        });
                                        const uParams = (plan.params || []).map((p: any) => {
                                            if (p.id === 'pb1') return { ...p, value: dMat.toString() };
                                            if (p.id === 'pb2') return { ...p, value: dLabor.toString() };
                                            return p;
                                        });
                                        const pc = calcPc(calcPp(uParams, areaNumber), sumActive(parametrosGlobais.ms_params), sumActive(parametrosGlobais.co_params));
                                        const mensal = pc / (parametrosGlobais.installments || 24);

                                        return (
                                            <div key={plan.id} className="rounded-2xl border-2 border-secondary bg-white p-8 text-center shadow-xl relative overflow-hidden">
                                                <div className="absolute top-0 right-0 bg-secondary text-secondary-foreground px-4 py-1 text-[10px] font-black uppercase tracking-widest">Recomendado</div>

                                                <div className="flex flex-col items-center mb-6">
                                                    <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                                                        <ShieldCheck className="w-8 h-8 text-secondary" />
                                                    </div>
                                                    <h4 className="text-2xl font-heading font-black text-foreground uppercase tracking-tighter">Plano Entrega Facilitada</h4>
                                                </div>

                                                <div className="flex items-baseline justify-center gap-1 mb-2">
                                                    <span className="text-muted-foreground text-sm font-bold uppercase">R$</span>
                                                    <span className="text-5xl font-heading font-black text-secondary">{mensal.toFixed(0)}</span>
                                                    <span className="text-muted-foreground text-sm font-bold">/mês</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground font-bold mb-8 italic">Proteção garantida em 24 parcelas recorrentes</p>

                                                <div className="space-y-3 text-left">
                                                    {(compositionItems || []).filter(item => item.in_basico).map(item => (
                                                        <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/5 border border-secondary/10">
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                            <span className="text-xs font-bold text-foreground/80">{item.nome}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Step 4: Arquivos */}
                    <Card className="border-border/50 bg-card shadow-sm">
                        <CardHeader className="pb-4 border-b border-border/50 bg-muted/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <FileUp className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>Anexar Laudos</CardTitle>
                                    <CardDescription>Obrigatórios para validarmos o padrão da restauração.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label className="font-bold">Contrato de Locação *</Label>
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors border-border">
                                        <div className="flex flex-col items-center justify-center p-4 text-center">
                                            <FileUp className="w-6 h-6 mb-2 text-muted-foreground" />
                                            <span className="text-xs font-bold text-muted-foreground">{contratoFile ? contratoFile.name : "Clique para enviar seu Contrato de Locação (PDF)"}</span>
                                        </div>
                                        <input type="file" className="hidden" accept=".pdf" onChange={e => setContratoFile(e.target.files?.[0] || null)} />
                                    </label>
                                </div>
                                <div className="space-y-3">
                                    <Label className="font-bold">Vistoria Inicial *</Label>
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors border-border">
                                        <div className="flex flex-col items-center justify-center p-4 text-center">
                                            <FileUp className="w-6 h-6 mb-2 text-muted-foreground" />
                                            <span className="text-xs font-bold text-muted-foreground">{vistoriaFile ? vistoriaFile.name : "Clique para enviar seu Laudo de Vistoria (PDF)"}</span>
                                        </div>
                                        <input type="file" className="hidden" accept=".pdf" onChange={e => setVistoriaFile(e.target.files?.[0] || null)} />
                                    </label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col items-center gap-6 pt-6">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-16 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-black text-xl uppercase tracking-tighter shadow-2xl shadow-secondary/20 rounded-2xl"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : "Concluir e Ir para Assinatura ➔"}
                        </Button>
                        <p className="text-xs text-muted-foreground font-bold flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Pagamento 100% seguro via cobrança recorrente. Sem juros.
                        </p>
                    </div>
                </form>
            </div >
        </div >
    );
};

export default PublicCheckoutPage;

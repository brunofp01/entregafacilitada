import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileUp, Home, User, Loader2, ShieldCheck, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { ContratoPDF } from "@/components/vistorias/ContratoPDF";
import { FormulaParam, PlanConfig, calcPc, calcPp, sumActive } from "@/lib/pricingCalc";

const PublicCheckoutPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [parametrosGlobais, setParametrosGlobais] = useState<any>(null);
    const [compositionItems, setCompositionItems] = useState<any[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string>("completo");
    const [parcelas, setParcelas] = useState<number>(24);

    // Formulário State pre-filled from lead capture
    const [inquilino, setInquilino] = useState({
        nome: sessionStorage.getItem("pending_lead_name") || "",
        email: "",
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

    const [contratoFile, setContratoFile] = useState<File | null>(null);
    const [vistoriaFile, setVistoriaFile] = useState<File | null>(null);

    useEffect(() => {
        const fetchConfigs = async () => {
            try {
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
                console.error("Erro ao buscar configs:", error);
            }
        };
        fetchConfigs();
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

        try {
            // 0. Use a master session or default imobiliaria for public leads
            // For now, we'll try to get the admin's id as the imobiliaria_id provider
            const { data: adminProfile } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
            const imobiliariaId = adminProfile?.id;

            if (!imobiliariaId) throw new Error("Sistema temporariamente indisponível para contratação pública.");

            // 1. Upload files
            const locacaoId = crypto.randomUUID();
            const { error: errContrato } = await supabase.storage.from("vistorias").upload(`documentos_locacao/${locacaoId}.pdf`, contratoFile);
            if (errContrato) throw new Error("Falha ao anexar contrato de locação");
            const contratoLocacaoUrl = supabase.storage.from("vistorias").getPublicUrl(`documentos_locacao/${locacaoId}.pdf`).data.publicUrl;

            const vistUplId = crypto.randomUUID();
            const { error: errVist } = await supabase.storage.from("vistorias").upload(`documentos_locacao/${vistUplId}.pdf`, vistoriaFile);
            if (errVist) throw new Error("Falha ao anexar PDF de vistoria");
            const vistoriaUploadUrl = supabase.storage.from("vistorias").getPublicUrl(`documentos_locacao/${vistUplId}.pdf`).data.publicUrl;

            // 2. Generate PDF and Autentique (Mock or Real depending on env)
            const pdfGenerator = await import('@react-pdf/renderer');
            const pdf = pdfGenerator.pdf;

            // Get template
            const { data: configData } = await supabase.from('pricing_parameters_config').select('contract_template').eq('id', 1).single();
            const template = configData?.contract_template;
            const sections = Array.isArray(template) ? template : template?.sections;
            const title = Array.isArray(template) ? undefined : template?.title;

            const contratoBlob = await pdf(
                <ContratoPDF
                    inquilino={inquilino}
                    imovel={imovel}
                    imobiliariaPerfil={null}
                    sections={sections}
                    title={title}
                />
            ).toBlob();

            const servicoContractId = crypto.randomUUID();
            await supabase.storage.from("vistorias").upload(`contratos_servico/${servicoContractId}.pdf`, contratoBlob);
            const contratoServicoUrl = supabase.storage.from("vistorias").getPublicUrl(`contratos_servico/${servicoContractId}.pdf`).data.publicUrl;

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
                    const pp = calcPp(plan.params, areaN);
                    const ms = sumActive(parametrosGlobais.ms_params || []);
                    const co = sumActive(parametrosGlobais.co_params || []);
                    finalPc = calcPc(pp, ms, co);
                }
            }

            // 5. Create record
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
                vistoria_upload_url: vistoriaUploadUrl,
                autentique_document_id: autentiqueDocId,
                status_assinatura: 'pendente',
                imovel_area: parseFloat(imovel.area) || 0,
                plano_id: planoObj?.id || null,
                plano_nome: planoObj?.label || null,
                plano_valor_pc: finalPc || 0,
                plano_parcelas: parcelas,
                plano_mensalidade: finalPc > 0 ? (finalPc / parcelas) : 0
            });

            if (dbError) throw dbError;

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
                                <Input required placeholder="000.000.000-00" value={inquilino.cpf} onChange={e => setInquilino({ ...inquilino, cpf: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>RG *</Label>
                                <Input required placeholder="00.000.000-0" value={inquilino.rg} onChange={e => setInquilino({ ...inquilino, rg: e.target.value })} />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label>WhatsApp *</Label>
                                <Input required placeholder="(00) 00000-0000" value={inquilino.telefone} onChange={e => setInquilino({ ...inquilino, telefone: e.target.value })} />
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
                                    <Label>Metragem (m²) *</Label>
                                    <Input type="number" required value={imovel.area} onChange={e => setImovel({ ...imovel, area: e.target.value })} className="font-mono font-bold" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Step 3: Plano */}
                    <Card className="border-secondary/30 bg-secondary/5 shadow-sm">
                        <CardHeader className="pb-4 border-b border-secondary/20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle>Plano Escolhido</CardTitle>
                                    <CardDescription>Verifique os valores calculados para a metragem do seu imóvel.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {!parametrosGlobais ? (
                                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                            ) : (
                                <div className="grid md:grid-cols-2 gap-6">
                                    {parametrosGlobais.plans?.map((plan: any) => {
                                        const areaN = parseFloat(imovel.area) || 0;
                                        const pp = calcPp(plan.params, areaN);
                                        const ms = sumActive(parametrosGlobais.ms_params || []);
                                        const co = sumActive(parametrosGlobais.co_params || []);
                                        const finalPc = calcPc(pp, ms, co);
                                        const isSelected = selectedPlanId === plan.id;

                                        return (
                                            <div
                                                key={plan.id}
                                                onClick={() => setSelectedPlanId(plan.id)}
                                                className={`cursor-pointer rounded-2xl border-2 p-6 transition-all ${isSelected ? 'border-secondary bg-white shadow-lg scale-[1.02]' : 'border-border bg-muted/50 opacity-60'}`}
                                            >
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="font-black uppercase tracking-widest text-sm">{plan.label}</span>
                                                    {isSelected && <Check className="w-5 h-5 text-secondary" />}
                                                </div>
                                                <div className="text-3xl font-black text-foreground mb-4">
                                                    <span className="text-sm font-bold opacity-70 mr-1">R$</span>
                                                    {(finalPc / parcelas).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    <span className="text-sm font-bold opacity-70 ml-1">/{parcelas}x</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {compositionItems.filter(item => plan.id === 'basico' ? item.in_basico : item.in_completo).slice(0, 3).map(item => (
                                                        <div key={item.id} className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                                            <Check className="w-3 h-3 text-secondary" />
                                                            {item.nome}
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
            </div>
        </div>
    );
};

export default PublicCheckoutPage;

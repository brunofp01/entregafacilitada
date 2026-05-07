import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { InquilinoForm } from "@/components/contratacao/InquilinoForm";
import { ImovelForm } from "@/components/contratacao/ImovelForm";
import { PlanoSelection } from "@/components/contratacao/PlanoSelection";
import { DocumentacaoForm } from "@/components/contratacao/DocumentacaoForm";
import { calcPc, calcPp, sumActive, calculateCompositionTotals } from "@/lib/pricingCalc";

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
    const [parcelas, setParcelas] = useState<number>(24);
    const [contratoFile, setContratoFile] = useState<File | null>(null);
    const [vistoriaTipo, setVistoriaTipo] = useState<"plataforma" | "upload">("upload");
    const [vistoriaFile, setVistoriaFile] = useState<File | null>(null);
    const [vistoriaIdVinculada, setVistoriaIdVinculada] = useState<string>("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setImobiliariaPerfil(profile);
                setUserRole(profile?.role || "imobiliaria");

                if (profile?.role === 'inquilino') {
                    setInquilino(prev => ({ ...prev, nome: profile.full_name || "", email: profile.email || "" }));
                    setVistoriaTipo("upload");
                }

                const imobiliariaId = profile?.imobiliaria_id || user.id;

                const { data: vistorias } = await supabase
                    .from("vistorias")
                    .select("id, rua, numero, complemento, cidade, metragem, tipo, created_at")
                    .eq("imobiliaria_id", imobiliariaId)
                    .in("status", ["concluida", "aguardando_aprovacao"])
                    .order("created_at", { ascending: false });

                if (vistorias) setVistoriasConcluidas(vistorias as VistoriaPlataforma[]);

                const { data: configData } = await supabase.from('pricing_parameters_config').select('*').eq('id', 1).single();
                if (configData) {
                    setParametrosGlobais(configData);
                    if (configData.installments) setParcelas(configData.installments);
                }

                const { data: compData } = await supabase.from('cost_composition_items').select('*').order('created_at', { ascending: true });
                if (compData) setCompositionItems(compData);

            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setFetchingVistorias(false);
            }
        };
        fetchData();
    }, []);

    const handleCepSearch = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '');
        setImovel(prev => ({ ...prev, cep: cleanCep }));
        if (cleanCep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    setImovel(prev => ({ ...prev, rua: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf }));
                    toast.success("Endereço preenchido automaticamente!");
                }
            } catch { toast.error("Erro ao buscar CEP."); }
        }
    };

    const handleContratar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inquilino.nome || !inquilino.cpf || !imovel.cep || !imovel.area) {
            toast.error("Por favor, preencha todos os dados obrigatórios.");
            return;
        }
        if (!contratoFile) {
            toast.error("O upload do Contrato de Locação assinado é obrigatório.");
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            // Calculate final PC
            const areaNumber = parseFloat(imovel.area) || 0;
            const plan = parametrosGlobais.plans?.find((p: any) => p.id === 'basico');
            const { material, labor } = calculateCompositionTotals(compositionItems, areaNumber, 'basico');
            const uParams = (plan.params || []).map((p: any) => {
                if (p.id === 'pb1' || p.id === 'pc1') return { ...p, value: material.toFixed(2) };
                if (p.id === 'pb2' || p.id === 'pc2') return { ...p, value: labor.toFixed(2) };
                return p;
            });
            const pc = calcPc(calcPp(uParams, areaNumber), sumActive(parametrosGlobais.ms_params), sumActive(parametrosGlobais.co_params));

            // Upload files
            const uploadFile = async (file: File, prefix: string) => {
                const fileName = `${prefix}_${Date.now()}_${file.name}`;
                const { data, error } = await supabase.storage.from('contratos').upload(fileName, file);
                if (error) throw error;
                const { data: { publicUrl } } = supabase.storage.from('contratos').getPublicUrl(data.path);
                return publicUrl;
            };

            const contratoUrl = await uploadFile(contratoFile, 'locacao');
            let vistoriaUrl = "";
            if (vistoriaTipo === 'upload' && vistoriaFile) {
                vistoriaUrl = await uploadFile(vistoriaFile, 'vistoria');
            }

            const payload = {
                imobiliaria_id: imobiliariaPerfil?.imobiliaria_id || user.id,
                inquilino: { ...inquilino, role: 'inquilino' },
                imovel,
                contrato_url: contratoUrl,
                vistoria_url: vistoriaUrl,
                vistoria_id: vistoriaTipo === 'plataforma' ? vistoriaIdVinculada : null,
                plano: { id: 'basico', pc, parcelas }
            };

            const response = await fetch('/api/create-sale', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Erro ao processar venda");

            toast.success("Contratação realizada com sucesso!");
            navigate(userRole === 'inquilino' ? '/inquilino/atendimento' : '/imobiliaria/inquilinos');

        } catch (error: any) {
            console.error("Erro na contratação:", error);
            toast.error(error.message || "Erro ao processar a contratação.");
        } finally {
            setLoading(false);
        }
    };

    const getSmartSuggestions = (): VistoriaPlataforma[] => {
        const iRua = (imovel.rua || "").toLowerCase().trim();
        const iNum = (imovel.numero || "").trim();
        if (!iRua || !iNum) return [];
        const matches = vistoriasConcluidas.filter(v => (v.rua || "").toLowerCase().trim() === iRua && (v.numero || "").trim() === iNum);
        if (matches.length === 0) return [];
        const sorted = [...matches].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        if (sorted[0].tipo === 'saida') return [];
        const twoMonthsAgo = new Date(); twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        const valid = sorted.filter(v => v.tipo === 'entrada' && new Date(v.created_at || 0) >= twoMonthsAgo);
        return valid.length > 0 ? [valid[0]] : [];
    };

    const matchingVistorias = getSmartSuggestions();
    const selectedVistoria = vistoriasConcluidas.find(v => v.id === vistoriaIdVinculada);
    const showComplementWarning = selectedVistoria?.complemento && imovel.complemento &&
        selectedVistoria.complemento.toLowerCase().trim() !== imovel.complemento.toLowerCase().trim();

    return (
        <DashboardLayout role={userRole as any}>
            <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <header className="mb-8 text-center md:text-left">
                    <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2 italic tracking-tight">Contratar Entrega Facilitada</h1>
                    <p className="text-muted-foreground leading-relaxed">
                        Preencha os dados do locatário e do imóvel alugado para gerar a proteção.
                    </p>
                </header>

                <form onSubmit={handleContratar} className="space-y-8">
                    <InquilinoForm
                        data={inquilino}
                        onChange={setInquilino}
                        disabledFields={userRole === 'inquilino' ? ['nome', 'email'] : []}
                    />

                    <ImovelForm
                        data={imovel}
                        onChange={setImovel}
                        onCepSearch={handleCepSearch}
                        userRole={userRole}
                        matchingVistorias={matchingVistorias}
                        vistoriaTipo={vistoriaTipo}
                        vistoriaIdVinculada={vistoriaIdVinculada}
                        onVistoriaSelect={(id) => {
                            setVistoriaIdVinculada(id);
                            setVistoriaTipo('plataforma');
                            const v = matchingVistorias.find(x => x.id === id);
                            if (v?.metragem) setImovel(prev => ({ ...prev, area: String(v.metragem) }));
                        }}
                        showComplementWarning={showComplementWarning}
                        selectedVistoria={selectedVistoria}
                    />

                    <PlanoSelection
                        area={imovel.area}
                        parametrosGlobais={parametrosGlobais}
                        compositionItems={compositionItems}
                        parcelas={parcelas}
                        onParcelasChange={setParcelas}
                    />

                    <DocumentacaoForm
                        contratoFile={contratoFile}
                        onContratoFileChange={setContratoFile}
                        vistoriaTipo={vistoriaTipo}
                        onVistoriaTipoChange={setVistoriaTipo}
                        vistoriaFile={vistoriaFile}
                        onVistoriaFileChange={setVistoriaFile}
                        vistoriaIdVinculada={vistoriaIdVinculada}
                        onVistoriaIdVinculadaChange={setVistoriaIdVinculada}
                        vistoriasConcluidas={vistoriasConcluidas}
                        fetchingVistorias={fetchingVistorias}
                        userRole={userRole}
                        isVistoriaIntegrada={vistoriaTipo === 'plataforma' && !!vistoriaIdVinculada && matchingVistorias.some(v => v.id === vistoriaIdVinculada)}
                    />

                    <div className="flex flex-col sm:flex-row justify-end pt-6">
                        <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold shadow-xl shadow-secondary/20 h-14 px-10 rounded-xl">
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

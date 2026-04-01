import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Camera, Trash2, CheckCircle2, ChevronRight, LayoutGrid, Droplets, Zap, Flame, Loader2, Save } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useVistoriaImage } from "@/hooks/useVistoriaImage";
import { pdf } from '@react-pdf/renderer';
import { VistoriaPDF } from "@/components/vistorias/VistoriaPDF";

interface Item {
  id: string;
  nome: string;
  estado: "Novo" | "Bom" | "Regular" | "Ruim";
  observacao: string;
  fotos: string[];
}

interface Ambiente {
  id: string;
  nome: string;
  itens: Item[];
}

const NewVistoria = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vistoriaId = searchParams.get("id");
  const { processImage } = useVistoriaImage();
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!vistoriaId);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [imobiliariaPerfil, setImobiliariaPerfil] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [inspectionPhase, setInspectionPhase] = useState<'setup' | 'master' | 'detail'>(vistoriaId ? 'master' : 'setup');
  const [status, setStatus] = useState<string>("rascunho");
  const [activeAmbienteId, setActiveAmbienteId] = useState<string | null>(null);

  const isViewMode = searchParams.get("view") === "true";
  const isViewOnly = status === "concluida" || isViewMode;

  // Form State
  const [imovel, setImovel] = useState({ 
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    complemento: ""
  });
  
  const [medidores, setMedidores] = useState({
    agua: { leitura: "", foto: "" },
    luz: { leitura: "", foto: "" },
    gas: { leitura: "", foto: "" }
  });

  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);

  useEffect(() => {
    fetchProfile();
    if (vistoriaId) {
      loadVistoria();
    }
  }, [vistoriaId]);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setCurrentUserProfile(data);
      
      // Carregar perfil da imobiliária para o PDF
      const imobiliariaId = data?.imobiliaria_id || data?.id;
      const { data: perfil } = await supabase.from('imobiliaria_perfil').select('*').eq('imobiliaria_id', imobiliariaId).maybeSingle();
      setImobiliariaPerfil(perfil);
    }
  };

  const loadVistoria = async () => {
    try {
      const { data, error } = await supabase
        .from("vistorias")
        .select(`
          *,
          vistoria_ambientes (
            id,
            nome,
            ordem,
            vistoria_itens (
              id,
              nome,
              estado,
              observacao,
              fotos
            )
          )
        `)
        .eq("id", vistoriaId)
        .single();

      if (error) throw error;

      setImovel({
        cep: data.cep || "",
        rua: data.rua || "",
        numero: data.numero || "",
        bairro: data.bairro || "",
        cidade: data.cidade || "",
        estado: data.estado || "",
        complemento: data.complemento || ""
      });
      setMedidores(data.medidores || medidores);
      setStatus(data.status);
      
      const loadedAmbientes = data.vistoria_ambientes.map((a: any) => ({
        id: a.id,
        nome: a.nome,
        itens: a.vistoria_itens.map((i: any) => ({
          id: i.id,
          nome: i.nome,
          estado: i.estado,
          observacao: i.observacao || "",
          fotos: i.fotos || []
        }))
      }));
      setAmbientes(loadedAmbientes);
      setInspectionPhase('master');
      if (loadedAmbientes.length > 0) setActiveAmbienteId(loadedAmbientes[0].id);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dados da vistoria.");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleCepSearch = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    setImovel(prev => ({ ...prev, cep: cleanCep }));
    
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (data.erro) {
          toast.error("CEP não encontrado.");
          return;
        }

        setImovel(prev => ({
          ...prev,
          rua: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf
        }));
        toast.success("Endereço preenchido!");
      } catch (error) {
        toast.error("Erro ao buscar CEP.");
      }
    }
  };

  const syncVistoriaData = async (currentVistoriaId: string) => {
    // Sync Ambientes and Itens
    await supabase.from('vistoria_ambientes').delete().eq('vistoria_id', currentVistoriaId);
    
    for (const amb of ambientes) {
      const { data: newAmb, error: ambError } = await supabase
        .from('vistoria_ambientes')
        .insert({ vistoria_id: currentVistoriaId, nome: amb.nome })
        .select().single();
      
      if (ambError) throw ambError;

      if (amb.itens.length > 0) {
        const { error: itensError } = await supabase.from('vistoria_itens').insert(
          amb.itens.map(i => ({
            ambiente_id: newAmb.id,
            nome: i.nome,
            estado: i.estado,
            observacao: i.observacao,
            fotos: i.fotos
          }))
        );
        if (itensError) throw itensError;
      }
    }
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      const imobiliariaId = currentUserProfile?.imobiliaria_id || currentUserProfile?.id;
      
      const payload = {
        imobiliaria_id: imobiliariaId,
        cep: imovel.cep,
        rua: imovel.rua,
        numero: imovel.numero,
        bairro: imovel.bairro,
        cidade: imovel.cidade,
        estado: imovel.estado,
        complemento: imovel.complemento,
        medidores,
        status: 'rascunho'
      };

      let currentVistoriaId = vistoriaId;

      if (vistoriaId) {
        await supabase.from('vistorias').update(payload).eq('id', vistoriaId);
      } else {
        const { data, error } = await supabase.from('vistorias').insert(payload).select().single();
        if (error) throw error;
        currentVistoriaId = data.id;
      }

      await syncVistoriaData(currentVistoriaId);

      toast.success("Rascunho salvo!");
      if (!vistoriaId) navigate(`/imobiliaria/vistorias/nova?id=${currentVistoriaId}`, { replace: true });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar rascunho.");
    } finally {
      setLoading(false);
    }
  };

  const getStandardItems = (ambienteNome: string): Item[] => {
    const common = ["Piso", "Pintura / Paredes", "Teto", "Portas / Batentes", "Janelas / Vidros", "Interruptores e Tomadas"];
    if (ambienteNome.includes("Cozinha") || ambienteNome.includes("Banheiro") || ambienteNome.includes("Área de Serviço")) {
      common.push("Torneiras / Sifão", "Ralos", "Revestimento Cerâmico");
    }
    if (ambienteNome.includes("Banheiro")) {
      common.push("Vaso Sanitário", "Box / Chuveiro", "Bancada / Pia");
    }
    if (ambienteNome.includes("Cozinha")) {
      common.push("Bancada / Pia", "Gabinete");
    }
    
    return common.map(nome => ({
      id: crypto.randomUUID(),
      nome,
      estado: "Bom",
      observacao: "",
      fotos: []
    }));
  };

  const addAmbiente = (nome?: string) => {
    if (isViewOnly) return;
    const finalNome = nome || prompt("Nome do ambiente (ex: Sala, Quarto 1):");
    if (finalNome) {
      const newAmbiente: Ambiente = {
        id: crypto.randomUUID(),
        nome: finalNome,
        itens: getStandardItems(finalNome)
      };
      setAmbientes([...ambientes, newAmbiente]);
      setActiveAmbienteId(newAmbiente.id);
      toast.success(`${finalNome} adicionado!`);
    }
  };

  const addItem = (ambienteId: string) => {
    if (isViewOnly) return;
    const nome = prompt("Nome do item (ex: Piso, Pintura, Janela):");
    if (nome) {
      setAmbientes(ambientes.map(a => 
        a.id === ambienteId 
          ? { ...a, itens: [...a.itens, { 
              id: crypto.randomUUID(), 
              nome, 
              estado: "Bom", 
              observacao: "", 
              fotos: [] 
            }] } 
          : a
      ));
    }
  };

  const handleFileUpload = async (ambienteId: string, itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (isViewOnly) return;
    const files = e.target.files;
    if (!files) return;

    toast.info("Processando e otimizando imagem...");
    
    for (const file of Array.from(files)) {
      const optimizedFile = await processImage(file);
      
      const fileName = `temp/${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage
        .from('vistorias')
        .upload(fileName, optimizedFile);

      if (error) {
        toast.error("Erro ao subir imagem");
        continue;
      }

      const { data: { publicUrl } } = supabase.storage.from('vistorias').getPublicUrl(fileName);

      setAmbientes(ambientes.map(a => 
        a.id === ambienteId 
          ? { ...a, itens: a.itens.map(i => 
              i.id === itemId ? { ...i, fotos: [...i.fotos, publicUrl] } : i
            ) } 
          : a
      ));
    }
    toast.success("Foto adicionada!");
  };

  const handleMeterUpload = async (key: 'agua' | 'luz' | 'gas', e: React.ChangeEvent<HTMLInputElement>) => {
    if (isViewOnly) return;
    const file = e.target.files?.[0];
    if (!file) return;

    toast.info("Processando e otimizando imagem do medidor...");
    
    try {
      const optimizedFile = await processImage(file);
      const fileName = `medidores/${crypto.randomUUID()}.jpg`;
      
      const { error } = await supabase.storage
        .from('vistorias')
        .upload(fileName, optimizedFile);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('vistorias').getPublicUrl(fileName);

      setMedidores({
        ...medidores,
        [key]: { ...medidores[key], foto: publicUrl }
      });
      toast.success(`Foto de ${key} salva!`);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao subir imagem do medidor");
    }
  };

  const handleFinish = async () => {
    if (isViewOnly) return;
    const hasIncomplete = ambientes.some(a => 
      a.itens.some(i => (i.estado === 'Regular' || i.estado === 'Ruim') && (!i.observacao || i.fotos.length === 0))
    );

    if (hasIncomplete) {
      toast.error("Existem itens com avarias (Regular/Ruim) sem foto ou observação. Por favor, revise os ambientes marcados.");
      // Opcional: navegar para o primeiro ambiente incompleto
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const imobiliariaId = profile?.imobiliaria_id || profile?.id;

      const blob = await pdf(<VistoriaPDF data={{ 
        ...imovel,
        medidores, 
        ambientes,
        perfil: imobiliariaPerfil
      }} />).toBlob();
      
      const pdfPath = `laudos/${crypto.randomUUID()}.pdf`;
      const { error: uploadError } = await supabase.storage.from('vistorias').upload(pdfPath, blob);
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('vistorias').getPublicUrl(pdfPath);

      const payload = {
        imobiliaria_id: imobiliariaId,
        ...imovel,
        relatorio_url: publicUrl,
        status: 'aguardando_aprovacao'
      };

      if (vistoriaId) {
        const { error } = await supabase.from('vistorias').update(payload).eq('id', vistoriaId);
        if (error) throw error;
        await syncVistoriaData(vistoriaId);
      } else {
        const { data, error } = await supabase.from('vistorias').insert(payload).select().single();
        if (error) throw error;
        await syncVistoriaData(data.id);
      }

      toast.success("Vistoria finalizada e laudo gerado!");
      navigate("/imobiliaria/vistorias");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao finalizar vistoria.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <DashboardLayout role="imobiliaria">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="imobiliaria">
      <div className="max-w-4xl mx-auto pb-20">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-extrabold">{vistoriaId ? (isViewOnly && !isViewMode ? 'Vistoria Finalizada' : (isViewMode ? 'Visualização' : 'Editar Vistoria')) : 'Nova Vistoria Professional'}</h1>
            <p className="text-muted-foreground">{isViewOnly ? (isViewMode ? 'Modo de conferência de dados.' : 'Esta vistoria foi finalizada e não pode ser editada.') : 'Preencha os dados em campo conforme solicitado.'}</p>
          </div>
          <Badge className={isViewOnly ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-secondary/10 text-secondary border-secondary/20"}>
            {isViewMode ? 'Modo Visualização' : (isViewOnly ? 'Finalizada' : 'Modo Edição')}
          </Badge>
        </header>

        <Tabs value={String(step)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="1" onClick={() => setStep(1)}>1. Dados Iniciais</TabsTrigger>
            <TabsTrigger value="2" onClick={() => setStep(2)}>2. Medidores</TabsTrigger>
            <TabsTrigger value="3" onClick={() => setStep(3)}>3. Ambientes</TabsTrigger>
          </TabsList>

          <TabsContent value="1">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader><CardTitle>Informações do Imóvel</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">CEP</label>
                    <Input disabled={isViewOnly} placeholder="00000-000" value={imovel.cep} onChange={e => handleCepSearch(e.target.value)} maxLength={9} />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <label className="text-sm font-bold">Rua / Logradouro</label>
                    <Input disabled={isViewOnly} placeholder="Rua..." value={imovel.rua} onChange={e => setImovel({...imovel, rua: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Número</label>
                    <Input disabled={isViewOnly} placeholder="123" value={imovel.numero} onChange={e => setImovel({...imovel, numero: e.target.value})} />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <label className="text-sm font-bold">Complemento (opcional)</label>
                    <Input disabled={isViewOnly} placeholder="Apto 12..." value={imovel.complemento} onChange={e => setImovel({...imovel, complemento: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Bairro</label>
                    <Input disabled={isViewOnly} placeholder="Bairro..." value={imovel.bairro} onChange={e => setImovel({...imovel, bairro: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Cidade</label>
                    <Input disabled={isViewOnly} placeholder="Cidade..." value={imovel.cidade} onChange={e => setImovel({...imovel, cidade: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Estado (UF)</label>
                    <Input disabled={isViewOnly} placeholder="SP" value={imovel.estado} onChange={e => setImovel({...imovel, estado: e.target.value})} maxLength={2} />
                  </div>
                </div>
                
                <Button className="w-full bg-secondary font-bold mt-4" onClick={() => setStep(2)}>Próximo Passo <ChevronRight className="w-4 h-4 ml-2" /></Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { key: 'agua', label: 'Água', icon: Droplets, color: 'text-blue-500' },
                { key: 'luz', label: 'Luz', icon: Zap, color: 'text-yellow-500' },
                { key: 'gas', label: 'Gás', icon: Flame, color: 'text-orange-500' }
              ].map(m => (
                <Card key={m.key} className="border-border/50 bg-card/50">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className={`p-2 rounded-lg bg-muted ${m.color}`}><m.icon className="w-6 h-6" /></div>
                    <CardTitle className="text-lg">{m.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input disabled={isViewOnly} placeholder="Leitura (números)" value={(medidores as any)[m.key].leitura} 
                      onChange={e => setMedidores({...medidores, [m.key]: {...(medidores as any)[m.key], leitura: e.target.value}})} />
                    
                    {!isViewOnly ? (
                      <div className="space-y-2">
                        <label className="block cursor-pointer">
                          <div className={`border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center hover:bg-muted/50 transition-colors h-24 ${(medidores as any)[m.key].foto ? 'border-secondary/50 bg-secondary/5' : ''}`}>
                            { (medidores as any)[m.key].foto ? (
                              <div className="relative w-full h-full flex items-center justify-center">
                                <img src={(medidores as any)[m.key].foto} className="h-full object-contain rounded" />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                  <Camera className="w-5 h-5 text-white" />
                                </div>
                              </div>
                            ) : (
                              <>
                                <Camera className="w-5 h-5 text-muted-foreground mr-2" />
                                <span className="text-xs font-bold text-muted-foreground">Foto do Relógio</span>
                              </>
                            )}
                          </div>
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleMeterUpload(m.key as any, e)} />
                        </label>
                      </div>
                    ) : (
                      (medidores as any)[m.key].foto && (
                        <div className="h-24 bg-muted/20 rounded-lg flex items-center justify-center overflow-hidden border border-border">
                          <img src={(medidores as any)[m.key].foto} className="h-full object-contain" />
                        </div>
                      )
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-8 flex gap-4">
              <Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
              <Button className="flex-1 bg-secondary font-bold" onClick={() => setStep(3)}>Ir para Ambientes</Button>
            </div>
          </TabsContent>

          <TabsContent value="3" className="space-y-6">
            {inspectionPhase === 'setup' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-primary">Quais ambientes este imóvel possui?</h2>
                  <p className="text-muted-foreground">Toque para adicionar rapidamente.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { nome: "Sala", emoji: "🛋️" },
                    { nome: "Quarto 1", emoji: "🛏️" },
                    { nome: "Quarto 2", emoji: "🛏️" },
                    { nome: "Cozinha", emoji: "🍳" },
                    { nome: "Banheiro 1", emoji: "🚿" },
                    { nome: "Banheiro 2", emoji: "🚿" },
                    { nome: "Área de Serviço", emoji: "🧹" },
                    { nome: "Varanda", emoji: "🌿" }
                  ].map((quick) => (
                    <Button 
                      key={quick.nome} 
                      variant="outline" 
                      className="h-24 flex-col gap-2 border-2 hover:border-secondary/50 hover:bg-secondary/5 transition-all active:scale-95"
                      onClick={() => addAmbiente(quick.nome)}
                      disabled={ambientes.some(a => a.nome === quick.nome)}
                    >
                      <span className="text-2xl">{quick.emoji}</span>
                      <span className="font-bold text-xs uppercase tracking-tight">{quick.nome}</span>
                    </Button>
                  ))}
                </div>

                <div className="flex flex-col items-center gap-6">
                  <Button variant="outline" className="gap-2 border-dashed" onClick={() => addAmbiente()}>
                    <Plus className="w-4 h-4" /> Outro Ambiente
                  </Button>

                  {ambientes.length > 0 && (
                    <div className="w-full max-w-md space-y-4">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {ambientes.map(a => (
                          <Badge key={a.id} variant="secondary" className="pl-3 pr-1 py-1 gap-1 text-sm bg-secondary/10 text-secondary border-secondary/20">
                            {a.nome}
                            <Button variant="ghost" size="icon" className="h-4 w-4 hover:bg-transparent" onClick={() => setAmbientes(ambientes.filter(amb => amb.id !== a.id))}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      <Button className="w-full bg-secondary py-8 text-xl font-bold shadow-lg shadow-secondary/20 h-auto" onClick={() => setInspectionPhase('master')}>
                        Iniciar Vistoria <ChevronRight className="ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {inspectionPhase === 'master' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Painel de Progresso</h2>
                    <p className="text-sm text-muted-foreground">Toque no card para avaliar.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setInspectionPhase('setup')} className="gap-2 font-bold text-secondary">
                    <Plus className="w-4 h-4" /> Ambientes
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ambientes.map(a => {
                    const total = a.itens.length;
                    const evaluated = a.itens.filter(i => {
                      const isCritical = i.estado === 'Regular' || i.estado === 'Ruim';
                      if (isCritical) return i.fotos.length > 0 && i.observacao;
                      return i.estado !== 'Bom' || i.observacao || i.fotos.length > 0;
                    }).length;
                    
                    const progress = total > 0 ? (evaluated / total) * 100 : 0;
                    const isComplete = progress === 100;

                    return (
                      <Card 
                        key={a.id} 
                        className={`group cursor-pointer hover:border-secondary/50 transition-all border-2 active:bg-muted/10 ${isComplete ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-border/50'}`}
                        onClick={() => {
                          setActiveAmbienteId(a.id);
                          setInspectionPhase('detail');
                        }}
                      >
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="space-y-1">
                              <h3 className="font-bold text-lg group-hover:text-secondary transition-colors">{a.nome}</h3>
                              <p className="text-xs text-muted-foreground">{evaluated} de {total} avaliados</p>
                            </div>
                            {isComplete ? (
                              <div className="p-2 rounded-full bg-emerald-500/10"><CheckCircle2 className="text-emerald-500 w-6 h-6" /></div>
                            ) : (
                              <div className="p-2 rounded-full bg-muted text-muted-foreground group-hover:bg-secondary/10 group-hover:text-secondary transition-colors">
                                <ChevronRight className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-700 ${isComplete ? 'bg-emerald-500' : 'bg-secondary'}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {!isViewOnly && (
                  <div className="flex justify-center pt-8">
                    <Button 
                      size="lg" 
                      className="bg-secondary font-bold gap-2 px-12 py-8 text-xl shadow-xl shadow-secondary/20 w-full md:w-auto h-auto" 
                      onClick={handleFinish}
                      disabled={loading || ambientes.length === 0}
                    >
                      {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                      Finalizar e Gerar Laudo
                    </Button>
                  </div>
                )}
              </div>
            )}

            {inspectionPhase === 'detail' && activeAmbienteId && (
              <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 pb-20">
                <Button 
                  variant="outline" 
                  className="mb-4 gap-2 hover:bg-secondary/10 hover:text-secondary font-bold border-secondary/20 text-secondary" 
                  onClick={() => setInspectionPhase('master')}
                >
                  <ChevronRight className="w-4 h-4 rotate-180" /> Dashboard de Progresso
                </Button>

                <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-md z-10 py-4 border-b border-border/50">
                  <h2 className="text-2xl font-bold">{ambientes.find(a => a.id === activeAmbienteId)?.nome}</h2>
                  <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20 uppercase text-[10px] font-extrabold">
                    {ambientes.find(a => a.id === activeAmbienteId)?.itens.length} ITENS PARA AVALIAR
                  </Badge>
                </div>

                <div className="space-y-12">
                  {ambientes.find(a => a.id === activeAmbienteId)?.itens.map((item, idx) => {
                    const isCritical = item.estado === 'Regular' || item.estado === 'Ruim';
                    const hasPhotos = item.fotos.length > 0;
                    const hasObs = !!item.observacao;
                    const isDone = (isCritical ? (hasPhotos && hasObs) : (item.estado !== 'Bom' || hasObs || hasPhotos));

                    return (
                      <div key={item.id} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex flex-col gap-3">
                          <div className="flex justify-between items-center">
                            <Label className="text-lg font-extrabold flex items-center gap-2">
                              {item.nome}
                              {isDone && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                            </Label>
                            <Badge variant="outline" className="text-[9px] opacity-40 font-mono tracking-tighter">REF: {idx + 1}</Badge>
                          </div>
                          
                          {/* Segmented Control para Status com Toque Otimizado */}
                          <div className="flex p-1 bg-muted/60 rounded-2xl gap-1 border border-border/20">
                            {["Novo", "Bom", "Regular", "Ruim"].map((statusOption) => (
                              <button
                                key={statusOption}
                                onClick={() => {
                                  if (isViewOnly) return;
                                  setAmbientes(ambientes.map(a => 
                                    a.id === activeAmbienteId ? { ...a, itens: a.itens.map(i => i.id === item.id ? { ...i, estado: statusOption as any } : i) } : a
                                  ));
                                }}
                                className={`flex-1 py-4 px-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 active:scale-95 ${
                                  item.estado === statusOption 
                                    ? (statusOption === 'Novo' || statusOption === 'Bom' ? 'bg-background text-primary shadow-md border border-border/10' : 'bg-destructive text-white shadow-lg shadow-destructive/20 ring-2 ring-destructive/10') 
                                    : 'text-muted-foreground hover:bg-background/40'
                                }`}
                              >
                                {statusOption}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Expansão Condicional Suave com Glassmorphism */}
                        {(isCritical || hasPhotos || hasObs) && (
                          <div className="pl-4 border-l-4 border-secondary/20 space-y-6 animate-in slide-in-from-left-2 duration-300">
                             <div className="space-y-3">
                                <Label className="text-xs font-black uppercase tracking-widest flex justify-between items-center text-muted-foreground">
                                  <span>📝 Observações Técnicas</span>
                                  {isCritical && <span className="text-destructive animate-pulse text-[9px] bg-destructive/10 px-2 py-0.5 rounded-full">Obrigatório</span>}
                                </Label>
                                <Textarea 
                                  disabled={isViewOnly}
                                  placeholder="Ex: Riscos no piso, infiltração no teto..."
                                  value={item.observacao}
                                  className={`bg-muted/30 border-0 focus-visible:ring-secondary/50 placeholder:italic transition-shadow min-h-[100px] ${isCritical && !hasObs ? 'ring-2 ring-destructive/30 bg-destructive/5' : ''}`}
                                  onChange={e => {
                                    setAmbientes(ambientes.map(a => 
                                      a.id === activeAmbienteId ? { ...a, itens: a.itens.map(i => i.id === item.id ? { ...i, observacao: e.target.value } : i) } : a
                                    ));
                                  }}
                                />
                             </div>

                             <div className="space-y-3">
                               <Label className="text-xs font-black uppercase tracking-widest flex justify-between items-center text-muted-foreground">
                                 <span>📸 Registro Fotográfico</span>
                                 {isCritical && <span className="text-destructive animate-pulse text-[9px] bg-destructive/10 px-2 py-0.5 rounded-full">Obrigatório</span>}
                               </Label>
                               <div className="flex gap-3 overflow-x-auto py-2 px-1">
                                 {!isViewOnly && (
                                   <label className="shrink-0 w-28 h-28 border-3 border-dashed border-muted rounded-2xl flex flex-col items-center justify-center bg-muted/20 hover:bg-secondary/10 hover:border-secondary/50 transition-all cursor-pointer group active:scale-95">
                                      <Camera className={`w-10 h-10 mb-1 ${isCritical && !hasPhotos ? 'text-destructive' : 'text-muted-foreground group-hover:text-secondary'}`} />
                                      <span className="text-[9px] font-black tracking-widest uppercase opacity-60">FOTO</span>
                                      <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleFileUpload(activeAmbienteId, item.id, e)} />
                                   </label>
                                 )}
                                 
                                 {item.fotos.map((foto, fIdx) => (
                                   <div key={fIdx} className="relative shrink-0 w-28 h-28 group shadow-md hover:shadow-xl transition-shadow">
                                      <img src={foto} className="w-full h-full object-cover rounded-2xl border border-white/10" />
                                      {!isViewOnly && (
                                        <button 
                                          className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-2 shadow-xl hover:scale-110 active:scale-90 transition-transform"
                                          onClick={() => {
                                            setAmbientes(ambientes.map(a => 
                                              a.id === activeAmbienteId ? { ...a, itens: a.itens.map(i => i.id === item.id ? { ...i, fotos: i.fotos.filter((_, idx) => idx !== fIdx) } : i) } : a
                                            ));
                                          }}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                   </div>
                                 ))}
                               </div>
                             </div>
                          </div>
                        )}
                        <Separator className="opacity-30" />
                      </div>
                    );
                  })}
                </div>

                {!isViewOnly && (
                   <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-lg border-t border-border/50 z-30 md:relative md:bg-transparent md:border-0 md:p-0 md:mt-12 flex gap-4">
                     {!vistoriaId && (
                       <Button variant="outline" className="flex-1 py-8 h-auto font-bold gap-2" onClick={handleSaveDraft} disabled={loading}>
                         <Save className="w-5 h-5" /> Rascunho
                       </Button>
                     )}
                     <Button 
                       className="flex-[2] bg-secondary py-8 h-auto text-lg font-black uppercase tracking-wider shadow-xl shadow-secondary/30" 
                       onClick={() => setInspectionPhase('master')}
                     >
                       Salvar e Próximo
                     </Button>
                   </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default NewVistoria;

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
import { Plus, Camera, Trash2, CheckCircle2, ChevronRight, LayoutGrid, Droplets, Zap, Flame, Loader2, Save, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { useVistoriaImage } from "@/hooks/useVistoriaImage";
import { pdf } from '@react-pdf/renderer';
import { VistoriaPDF } from "@/components/vistorias/VistoriaPDF";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "@/components/ui/separator";

interface Item {
  id: string;
  nome: string;
  estado: "Novo" | "Bom" | "Regular" | "Ruim";
  observacao: string;
  fotos: string[];
  isExpanded?: boolean;
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
  const [newItemName, setNewItemName] = useState("");
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);

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
    complemento: "",
    metragem: "",
    tipo: ""
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
        complemento: data.complemento || "",
        metragem: data.metragem ? String(data.metragem) : "",
        tipo: data.tipo || ""
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
        metragem: parseFloat(imovel.metragem) || 0,
        tipo: imovel.tipo,
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
        itens: []
      };
      setAmbientes([...ambientes, newAmbiente]);
      setActiveAmbienteId(newAmbiente.id);
      toast.success(`${finalNome} adicionado!`);
    }
  };

  const addItem = (ambienteId: string, nomeOverride?: string) => {
    if (isViewOnly) return;
    const nome = nomeOverride || newItemName;
    if (nome.trim()) {
      setAmbientes(ambientes.map(a =>
        a.id === ambienteId
          ? {
            ...a, itens: [{
              id: crypto.randomUUID(),
              nome: nome.trim(),
              estado: "Bom",
              observacao: "",
              fotos: [],
              isExpanded: true
            }, ...a.itens]
          }
          : a
      ));
      setNewItemName("");
      toast.success(`${nome} adicionado!`);
    } else {
      toast.error("Digite o nome do item.");
    }
  };

  const removeItem = (ambienteId: string, itemId: string) => {
    if (isViewOnly) return;
    setAmbientes(ambientes.map(a =>
      a.id === ambienteId ? { ...a, itens: a.itens.filter(i => i.id !== itemId) } : a
    ));
    toast.success("Item removido");
  };

  const removeAmbiente = (id: string) => {
    if (isViewOnly) return;
    setAmbientes(ambientes.filter(a => a.id !== id));
    if (activeAmbienteId === id) setActiveAmbienteId(null);
    toast.success("Ambiente removido");
    setRoomToDelete(null);
  };

  const toggleItemExpansion = (ambienteId: string, itemId: string, force?: boolean) => {
    setAmbientes(ambientes.map(a =>
      a.id === ambienteId
        ? { ...a, itens: a.itens.map(i => i.id === itemId ? { ...i, isExpanded: force !== undefined ? force : !i.isExpanded } : i) }
        : a
    ));
  };

  const handleFileUpload = async (ambienteId: string, itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (isViewOnly) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        toast.info(`Processando foto ${i + 1} de ${fileList.length}...`);

        const optimizedFile = await processImage(file);
        const fileName = `vistorias/${crypto.randomUUID()}.jpg`; // Mantendo pasta vistorias

        const { error: uploadError } = await supabase.storage
          .from('vistorias')
          .upload(fileName, optimizedFile);

        if (uploadError) {
          toast.error(`Erro ao subir foto ${i + 1}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage.from('vistorias').getPublicUrl(fileName);

        setAmbientes(prev => prev.map(a =>
          a.id === ambienteId
            ? {
              ...a, itens: a.itens.map(item =>
                item.id === itemId ? { ...item, fotos: [...item.fotos, publicUrl] } : item
              )
            }
            : a
        ));
      }
      toast.success(`${fileList.length} foto(s) adicionada(s)!`);
    } catch (error) {
      console.error(error);
      toast.error("Erro no processamento das fotos.");
    } finally {
      setLoading(false);
    }
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

  const saveProgressAndNavigate = async (targetStep?: number) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('imobiliaria_id').eq('id', user.id).single();
      const imobiliariaId = profile?.imobiliaria_id || user.id;

      // Validação Estrita na Avanço para Aba 2 (Medidores)
      if (targetStep === 2) {
        if (!imovel.metragem || !imovel.tipo) {
          toast.error("Metragem e Tipo de Vistoria são obrigatórios.");
          setLoading(false);
          return;
        }
      }

      const payload = {
        imobiliaria_id: imobiliariaId,
        cep: imovel.cep,
        rua: imovel.rua,
        numero: imovel.numero,
        bairro: imovel.bairro,
        cidade: imovel.cidade,
        estado: imovel.estado,
        complemento: imovel.complemento,
        metragem: parseFloat(imovel.metragem) || 0,
        tipo: imovel.tipo,
        medidores,
        status: status || 'rascunho'
      };

      if (vistoriaId) {
        const { error } = await supabase.from('vistorias').update(payload).eq('id', vistoriaId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('vistorias').insert(payload).select().single();
        if (error) throw error;
        if (data) {
          navigate(`/imobiliaria/vistorias/nova?id=${data.id}`, { replace: true });
        }
      }

      if (targetStep) setStep(targetStep);
      toast.success("Progresso salvo!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar progresso.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    if (isViewOnly) return;
    const hasIncomplete = ambientes.some(a =>
      a.itens.some(i => (i.estado === 'Regular' || i.estado === 'Ruim') && (!i.observacao || i.fotos.length === 0))
    );

    if (hasIncomplete) {
      toast.error("Existem itens com avarias (Regular/Ruim) sem foto ou observação. Por favor, revise os ambientes marcados.");
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
        cep: imovel.cep,
        rua: imovel.rua,
        numero: imovel.numero,
        bairro: imovel.bairro,
        cidade: imovel.cidade,
        estado: imovel.estado,
        complemento: imovel.complemento,
        metragem: parseFloat(imovel.metragem) || 0,
        tipo: imovel.tipo,
        medidores,
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
        if (data) await syncVistoriaData(data.id);
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
          <div className="flex items-center gap-4">
            <Button variant="destructive" className="shrink-0 font-bold gap-2 hover:bg-destructive/90" onClick={() => navigate("/imobiliaria/vistorias")}>
              <ArrowLeft className="w-4 h-4" />
              Sair
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-extrabold leading-tight">{vistoriaId ? (isViewOnly && !isViewMode ? 'Vistoria Finalizada' : (isViewMode ? 'Visualização' : 'Editar Vistoria')) : 'Nova Vistoria Professional'}</h1>
              <p className="text-sm md:text-base text-muted-foreground">{isViewOnly ? (isViewMode ? 'Modo de conferência de dados.' : 'Esta vistoria foi finalizada e não pode ser editada.') : 'Preencha os dados em campo.'}</p>
            </div>
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
                    <Input disabled={isViewOnly} placeholder="Rua..." value={imovel.rua} onChange={e => setImovel({ ...imovel, rua: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Número</label>
                    <Input disabled={isViewOnly} placeholder="123" value={imovel.numero} onChange={e => setImovel({ ...imovel, numero: e.target.value })} />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <label className="text-sm font-bold">Complemento (opcional)</label>
                    <Input disabled={isViewOnly} placeholder="Apto 12..." value={imovel.complemento} onChange={e => setImovel({ ...imovel, complemento: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Bairro</label>
                    <Input disabled={isViewOnly} placeholder="Bairro..." value={imovel.bairro} onChange={e => setImovel({ ...imovel, bairro: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Cidade</label>
                    <Input disabled={isViewOnly} placeholder="Cidade..." value={imovel.cidade} onChange={e => setImovel({ ...imovel, cidade: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Estado (UF)</label>
                    <Input disabled={isViewOnly} placeholder="SP" value={imovel.estado} onChange={e => setImovel({ ...imovel, estado: e.target.value })} maxLength={2} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold w-full flex items-center justify-between">Metragem do Imóvel (m²) <span className="text-destructive">*</span></label>
                    <Input type="number" disabled={isViewOnly} placeholder="Ex: 85" value={imovel.metragem} onChange={e => setImovel({ ...imovel, metragem: e.target.value })} className="font-mono font-bold text-secondary" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold w-full flex items-center justify-between">Tipo de Vistoria <span className="text-destructive">*</span></label>
                    <Select disabled={isViewOnly} value={imovel.tipo} onValueChange={val => setImovel({ ...imovel, tipo: val })}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Toque para selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada" className="font-bold">📝 Vistoria de Entrada (Locação)</SelectItem>
                        <SelectItem value="saida" className="font-bold">🚪 Vistoria de Saída (Devolução)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button disabled={loading} className="w-full bg-secondary font-bold mt-4" onClick={() => saveProgressAndNavigate(2)}>
                  {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                  Próximo Passo <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
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
                      onChange={e => setMedidores({ ...medidores, [m.key]: { ...(medidores as any)[m.key], leitura: e.target.value } })} />

                    {!isViewOnly ? (
                      <div className="space-y-2">
                        <label className="block cursor-pointer">
                          <div className={`border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center hover:bg-muted/50 transition-colors h-24 ${(medidores as any)[m.key].foto ? 'border-secondary/50 bg-secondary/5' : ''}`}>
                            {(medidores as any)[m.key].foto ? (
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
                          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleMeterUpload(m.key as any, e)} />
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
              <Button disabled={loading} className="flex-1 bg-secondary font-bold" onClick={() => saveProgressAndNavigate(3)}>
                {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                Ir para Ambientes
              </Button>
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

            {inspectionPhase === 'master' && (() => {
              const totalItems = ambientes.reduce((acc, a) => acc + a.itens.length, 0);
              const validatedItems = ambientes.reduce((acc, a) => acc + a.itens.filter(i => i.estado && i.observacao.trim() !== "" && i.fotos.length > 0).length, 0);
              const totalProgress = totalItems > 0 ? (validatedItems / totalItems) * 100 : 0;

              return (
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
                        // Regra Universal Estrita: Status + Obs + Foto
                        return i.estado && i.observacao.trim() !== "" && i.fotos.length > 0;
                      }).length;

                      const progress = total > 0 ? (evaluated / total) * 100 : 0;
                      const isComplete = progress === 100;

                      return (
                        <div key={a.id} className="relative group">
                          {!isViewOnly && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRoomToDelete(a.id);
                              }}
                              className="absolute -top-2 -right-2 z-10 bg-destructive text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <Card
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
                        </div>
                      );
                    })}
                  </div>

                  {!isViewOnly && (
                    <div className="mt-8">
                      <Button
                        className="w-full py-10 h-auto text-xl font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-2xl shadow-emerald-500/20 rounded-2xl"
                        onClick={handleFinish}
                        disabled={loading || totalProgress < 100}
                      >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Gerar Laudo PDF Final"}
                      </Button>
                    </div>
                  )}

                  {/* AlertDialog para Confirmação de Exclusão de Ambiente */}
                  <AlertDialog open={!!roomToDelete} onOpenChange={(open) => !open && setRoomToDelete(null)}>
                    <AlertDialogContent className="rounded-3xl w-[95%] max-w-md mx-auto">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black">Excluir Ambiente?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação removerá permanentemente este ambiente e todos os seus itens avaliados da vistoria.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex flex-row gap-3 mt-4">
                        <AlertDialogCancel className="flex-1 rounded-2xl h-14 font-bold border-2">Não, Manter</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => roomToDelete && removeAmbiente(roomToDelete)}
                          className="flex-1 bg-destructive hover:bg-destructive/90 rounded-2xl h-14 font-bold"
                        >
                          Sim, Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })()}

            {inspectionPhase === 'detail' && activeAmbienteId && (
              <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 pb-20">
                <div className="sticky top-0 bg-background/95 backdrop-blur-md z-30 py-4 border-b border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-secondary/10 hover:text-secondary h-8 w-8"
                        onClick={() => setInspectionPhase('master')}
                      >
                        <ChevronRight className="w-5 h-5 rotate-180" />
                      </Button>
                      <h2 className="text-xl font-black tracking-tight">{ambientes.find(a => a.id === activeAmbienteId)?.nome}</h2>
                    </div>
                    <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20 uppercase text-[9px] font-extrabold tracking-widest px-2">
                      {ambientes.find(a => a.id === activeAmbienteId)?.itens.length} ITENS
                    </Badge>
                  </div>

                  {/* Barra de Progresso Real-Time Direbaixo do Header */}
                  {(() => {
                    const room = ambientes.find(a => a.id === activeAmbienteId);
                    const total = room?.itens.length || 0;
                    const evaluated = room?.itens.filter(i => {
                      // Regra Universal Estrita: Status + Obs + Foto
                      return i.estado && i.observacao.trim() !== "" && i.fotos.length > 0;
                    }).length || 0;
                    const progress = total > 0 ? (evaluated / total) * 100 : 0;

                    return (
                      <div className="px-1 pt-1">
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ease-out ${progress === 100 ? 'bg-emerald-500' : 'bg-secondary'}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase">{progress === 100 ? 'Ambiente Validado' : 'Progresso da Vistoria'}</span>
                          <span className="text-[9px] font-bold text-secondary">{Math.round(progress)}%</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-12">
                  {/* Adição Livre de Item */}
                  {!isViewOnly && (
                    <div className="p-4 bg-muted/20 border border-secondary/20 rounded-2xl flex flex-col gap-3 shadow-sm">
                      <Label className="text-xs font-black uppercase text-secondary tracking-widest px-1">Novo Item Personalizado</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newItemName}
                          onChange={e => setNewItemName(e.target.value)}
                          placeholder="Ex: Filtro da Piscina, Piso, Porta..."
                          className="bg-background/80 flex-1 h-12"
                          onKeyDown={e => e.key === 'Enter' && addItem(activeAmbienteId)}
                        />
                        <Button
                          onClick={() => addItem(activeAmbienteId)}
                          className="bg-secondary px-6 font-bold h-12 active:scale-95 transition-all"
                        >
                          <Plus className="w-5 h-5 mr-1" /> ADICIONAR
                        </Button>
                      </div>
                    </div>
                  )}

                  {ambientes.find(a => a.id === activeAmbienteId)?.itens.length === 0 && (
                    <div className="py-20 text-center opacity-30 border-2 border-dashed border-border rounded-3xl">
                      <Plus className="w-12 h-12 mx-auto mb-4" />
                      <p className="font-bold">Nenhum item cadastrado.<br />Adicione o primeiro acima.</p>
                    </div>
                  )}

                  {ambientes.find(a => a.id === activeAmbienteId)?.itens.map((item, idx) => {
                    const hasPhotos = item.fotos.length > 0;
                    const hasObs = !!item.observacao.trim();
                    const isDone = item.estado && hasPhotos && hasObs;
                    const isExpanded = item.isExpanded !== false; // Padrão expanded se undefined

                    return (
                      <div key={item.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Summary View (Collapsed) */}
                        {!isExpanded ? (
                          <div
                            className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl cursor-pointer active:scale-95 transition-transform"
                            onClick={() => toggleItemExpansion(activeAmbienteId, item.id)}
                          >
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              <span className="font-bold text-sm">{item.nome}</span>
                              <Badge variant="secondary" className="text-[8px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                {item.estado}
                              </Badge>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-secondary">
                              <ChevronRight className="w-5 h-5 rotate-90" />
                            </Button>
                          </div>
                        ) : (
                          /* Full Form View (Expanded) */
                          <div className="space-y-6">
                            <div className="flex flex-col gap-3">
                              <div className="flex justify-between items-center">
                                <Label className="text-lg font-extrabold flex items-center gap-2 flex-1">
                                  {item.nome}
                                  {isDone && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                </Label>
                                {!isViewOnly && (
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/50 hover:text-destructive hover:bg-destructive/10 rounded-full" onClick={() => removeItem(activeAmbienteId, item.id)}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                    <Badge variant="outline" className="text-[9px] opacity-40 font-mono tracking-tighter">REF: {idx + 1}</Badge>
                                  </div>
                                )}
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
                                    className={`flex-1 py-4 px-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 active:scale-95 ${item.estado === statusOption
                                      ? (statusOption === 'Novo' || statusOption === 'Bom' ? 'bg-background text-primary shadow-md border border-border/10' : 'bg-destructive text-white shadow-lg shadow-destructive/20 ring-2 ring-destructive/10')
                                      : 'text-muted-foreground hover:bg-background/40'
                                      }`}
                                  >
                                    {statusOption}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Expansão Condicional Universal (Sempre visível se tiver conteúdo ou para novo preenchimento) */}
                            <AnimatePresence initial={false}>
                              {(true) && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3, ease: "easeInOut" }}
                                  className="overflow-hidden"
                                >
                                  <div className="pl-4 border-l-4 border-secondary/20 space-y-6 pt-2 pb-4">
                                    <div className="space-y-3">
                                      <Label className="text-xs font-black uppercase tracking-widest flex justify-between items-center text-muted-foreground">
                                        <span>📝 Observações Técnicas</span>
                                        <span className="text-destructive animate-pulse text-[9px] bg-destructive/10 px-2 py-0.5 rounded-full">Obrigatório</span>
                                      </Label>
                                      <Textarea
                                        disabled={isViewOnly}
                                        placeholder="Ex: Condição do item, avarias, detalhes..."
                                        value={item.observacao}
                                        className={`bg-muted/10 border-border/50 focus-visible:ring-secondary/50 placeholder:italic transition-shadow min-h-[100px] ${!item.observacao.trim() ? 'ring-2 ring-destructive/30 bg-destructive/5' : ''}`}
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
                                        <span className="text-destructive animate-pulse text-[9px] bg-destructive/10 px-2 py-0.5 rounded-full">Obrigatório</span>
                                      </Label>
                                      <div className="flex gap-3 flex-wrap py-2 px-1">
                                        {!isViewOnly && (
                                          <label className="shrink-0 w-24 h-24 border-3 border-dashed border-muted rounded-2xl flex flex-col items-center justify-center bg-muted/20 hover:bg-secondary/10 hover:border-secondary/50 transition-all cursor-pointer group active:scale-95">
                                            <Camera className={`w-10 h-10 mb-1 ${!hasPhotos ? 'text-destructive' : 'text-muted-foreground group-hover:text-secondary'}`} />
                                            <span className="text-[9px] font-black tracking-widest uppercase opacity-60">FOTO</span>
                                            <input type="file" multiple accept="image/*" capture="environment" className="hidden" onChange={e => handleFileUpload(activeAmbienteId, item.id, e)} />
                                          </label>
                                        )}

                                        {item.fotos.map((foto, fIdx) => (
                                          <div key={fIdx} className="relative shrink-0 w-24 h-24 group shadow-md transition-shadow">
                                            <img src={foto} className="w-full h-full object-cover rounded-2xl border border-white/10" />
                                            {!isViewOnly && (
                                              <button
                                                type="button"
                                                className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-2 shadow-xl hover:scale-110 active:scale-95 transition-transform z-10"
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

                                    {/* Botão Salvar e Recolher */}
                                    {!isViewOnly && (
                                      <div className="pt-4">
                                        <Button
                                          className={`w-full py-6 h-auto font-black uppercase tracking-widest transition-all ${isDone ? 'bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20' : 'bg-muted text-muted-foreground cursor-not-allowed opacity-40'}`}
                                          disabled={!isDone}
                                          onClick={() => toggleItemExpansion(activeAmbienteId, item.id, false)}
                                        >
                                          Salvar e Recolher
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                            <Separator className="opacity-30 mt-6" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!isViewOnly && (
                  <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-lg border-t border-border/50 z-30 md:relative md:bg-transparent md:border-0 md:p-0 md:mt-12">
                    {(() => {
                      const room = ambientes.find(a => a.id === activeAmbienteId);
                      const total = room?.itens.length || 0;
                      const evaluated = room?.itens.filter(i => {
                        // Regra Universal Estrita: Status + Obs + Foto
                        return i.estado && i.observacao.trim() !== "" && i.fotos.length > 0;
                      }).length || 0;
                      const isComplete = total > 0 && evaluated === total;

                      return (
                        <Button
                          className={`w-full py-8 h-auto text-lg font-black uppercase tracking-wider shadow-xl transition-all ${isComplete ? 'bg-emerald-600 shadow-emerald-500/20 active:scale-95' : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                            }`}
                          disabled={!isComplete}
                          onClick={() => setInspectionPhase('master')}
                        >
                          {isComplete ? (
                            <span className="flex items-center gap-2 tracking-widest"><CheckCircle2 className="w-6 h-6" /> Finalizar Ambiente</span>
                          ) : (
                            <span>Avaliação Pendente ({evaluated}/{total})</span>
                          )}
                        </Button>
                      );
                    })()}
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

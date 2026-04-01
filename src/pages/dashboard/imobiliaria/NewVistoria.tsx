import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Camera, Trash2, CheckCircle2, ChevronRight, LayoutGrid, Droplets, Zap, Flame, FileDown, Loader2 } from "lucide-react";
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
  const { processImage } = useVistoriaImage();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Form State
  const [imovel, setImovel] = useState({ 
    endereco: "", 
    cliente: "", 
    data: new Date().toISOString().split('T')[0] 
  });
  
  const [medidores, setMedidores] = useState({
    agua: { leitura: "", foto: "" },
    luz: { leitura: "", foto: "" },
    gas: { leitura: "", foto: "" }
  });

  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [activeAmbiente, setActiveAmbiente] = useState<string | null>(null);

  // Actions
  const addAmbiente = () => {
    const nome = prompt("Nome do ambiente (ex: Sala, Quarto 1):");
    if (nome) {
      const newAmbiente: Ambiente = {
        id: crypto.randomUUID(),
        nome,
        itens: []
      };
      setAmbientes([...ambientes, newAmbiente]);
      setActiveAmbiente(newAmbiente.id);
    }
  };

  const addItem = (ambienteId: string) => {
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
    const files = e.target.files;
    if (!files) return;

    toast.info("Processando e otimizando imagem...");
    
    for (const file of Array.from(files)) {
      const optimizedFile = await processImage(file);
      
      // Upload to Supabase Storage (Pasta temporária)
      const fileName = `temp/${crypto.randomUUID()}.jpg`;
      const { data, error } = await supabase.storage
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

  const handleFinish = async () => {
    // Validação
    const hasIncomplete = ambientes.some(a => 
      a.itens.some(i => (i.estado === 'Regular' || i.estado === 'Ruim') && (!i.observacao || i.fotos.length === 0))
    );

    if (hasIncomplete) {
      toast.error("Itens em estado 'Regular' ou 'Ruim' exigem observação e foto.");
      return;
    }

    setLoading(true);
    try {
      // 1. Gerar PDF
      const blob = await pdf(<VistoriaPDF data={{ ...imovel, medidores, ambientes }} />).toBlob();
      
      // 2. Upload PDF
      const pdfPath = `laudos/${crypto.randomUUID()}.pdf`;
      await supabase.storage.from('vistorias').upload(pdfPath, blob);
      const { data: { publicUrl } } = supabase.storage.from('vistorias').getPublicUrl(pdfPath);

      // 3. Salvar no Banco
      const { data: userData } = await supabase.auth.getUser();
      const { error: dbError } = await supabase.from('vistorias').insert({
        imobiliaria_id: userData.user?.id,
        imovel_endereco: imovel.endereco,
        cliente_nome: imovel.cliente,
        medidores,
        relatorio_url: publicUrl,
        status: 'concluida'
      });

      if (dbError) throw dbError;

      toast.success("Vistoria finalizada com sucesso!");
      navigate("/imobiliaria/vistorias");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao finalizar vistoria.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="imobiliaria">
      <div className="max-w-4xl mx-auto pb-20">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-extrabold">Nova Vistoria Professional</h1>
            <p className="text-muted-foreground">Preencha os dados em campo conforme solicitado.</p>
          </div>
          <Badge className="bg-secondary/10 text-secondary border-secondary/20">Modo Offline Pronto</Badge>
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
                <div className="space-y-2">
                  <label className="text-sm font-bold">Endereço Completo</label>
                  <Input placeholder="Av. Paulista, 1000 - Apto 12..." value={imovel.endereco} onChange={e => setImovel({...imovel, endereco: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Nome do Cliente/Locatário</label>
                    <Input placeholder="João Silva" value={imovel.cliente} onChange={e => setImovel({...imovel, cliente: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Data</label>
                    <Input type="date" value={imovel.data} onChange={e => setImovel({...imovel, data: e.target.value})} />
                  </div>
                </div>
                <Button className="w-full bg-secondary font-bold" onClick={() => setStep(2)}>Próximo Passo <ChevronRight className="w-4 h-4 ml-2" /></Button>
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
                    <Input placeholder="Leitura (números)" value={(medidores as any)[m.key].leitura} 
                      onChange={e => setMedidores({...medidores, [m.key]: {...(medidores as any)[m.key], leitura: e.target.value}})} />
                    <Button variant="outline" className="w-full gap-2 border-dashed border-2 h-16">
                      <Camera className="w-5 h-5" /> Foto do Relógio
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-8 flex gap-4">
              <Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
              <Button className="flex-1 bg-secondary font-bold" onClick={() => setStep(3)}>Ir para Ambientes</Button>
            </div>
          </TabsContent>

          <TabsContent value="3">
            <div className="grid md:grid-cols-[250px_1fr] gap-8">
              <div className="space-y-4">
                <h3 className="font-bold flex items-center gap-2"><LayoutGrid className="w-4 h-4" /> Ambientes</h3>
                <div className="space-y-2">
                  {ambientes.map(a => (
                    <Button key={a.id} variant={activeAmbiente === a.id ? "secondary" : "outline"} 
                      className="w-full justify-between font-bold" onClick={() => setActiveAmbiente(a.id)}>
                      {a.nome} <Badge variant="outline" className="ml-2">{a.itens.length}</Badge>
                    </Button>
                  ))}
                  <Button variant="outline" className="w-full border-dashed border-2 py-6 gap-2" onClick={addAmbiente}>
                    <Plus className="w-4 h-4" /> Adicionar
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                {activeAmbiente ? (
                  <>
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold">{ambientes.find(a => a.id === activeAmbiente)?.nome}</h2>
                      <Button size="sm" variant="outline" className="gap-2" onClick={() => addItem(activeAmbiente)}>
                        <Plus className="w-4 h-4" /> Novo Item
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {ambientes.find(a => a.id === activeAmbiente)?.itens.map(item => (
                        <Card key={item.id} className="border-border/50 hover:border-secondary/20 transition-colors">
                          <CardContent className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="font-bold">{item.name}</span>
                              <Select value={item.estado} onValueChange={(val: any) => {
                                setAmbientes(ambientes.map(a => 
                                  a.id === activeAmbiente ? { ...a, itens: a.itens.map(i => i.id === item.id ? { ...i, estado: val } : i) } : a
                                ));
                              }}>
                                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Novo">Novo</SelectItem>
                                  <SelectItem value="Bom">Bom</SelectItem>
                                  <SelectItem value="Regular">Regular</SelectItem>
                                  <SelectItem value="Ruim">Ruim</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <Textarea placeholder="Observaçao técnica..." value={item.observacao} 
                              onChange={e => {
                                setAmbientes(ambientes.map(a => 
                                  a.id === activeAmbiente ? { ...a, itens: a.itens.map(i => i.id === item.id ? { ...i, observacao: e.target.value } : i) } : a
                                ));
                              }} />
                            
                            <div className="flex items-center gap-4">
                              <label className="flex-1">
                                <div className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors h-24">
                                  <Camera className="w-6 h-6 text-muted-foreground mb-1" />
                                  <span className="text-xs text-muted-foreground">Add Foto</span>
                                </div>
                                <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleFileUpload(activeAmbiente, item.id, e)} />
                              </label>

                              <div className="flex-1 flex gap-2 overflow-x-auto pb-2">
                                {item.fotos.map((foto, idx) => (
                                  <div key={idx} className="relative w-20 h-20 shrink-0">
                                    <img src={foto} className="w-full h-full object-cover rounded-lg border border-border" />
                                    <button className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                                      onClick={() => {
                                        setAmbientes(ambientes.map(a => 
                                          a.id === activeAmbiente ? { ...a, itens: a.itens.map(i => i.id === item.id ? { ...i, fotos: i.fotos.filter((_, fIdx) => fIdx !== idx) } : i) } : a
                                        ));
                                      }}><Trash2 className="w-3 h-3" /></button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center opacity-50">
                    <LayoutGrid className="w-12 h-12 mb-4" />
                    <p>Selecione ou adicione um ambiente para começar a detalhar itens.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-12 flex justify-end gap-4 border-t border-border pt-8">
               <Button variant="outline" size="lg" className="font-bold">Salvar Rascunho</Button>
               <Button size="lg" className="bg-secondary font-bold gap-2 px-8" onClick={handleFinish} disabled={loading}>
                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                 Finalizar e Gerar Laudo
               </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default NewVistoria;

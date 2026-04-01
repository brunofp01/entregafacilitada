import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ClipboardCheck, Calendar, FileText, Plus, Loader2, Eye, Search, SearchX, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

interface Vistoria {
  id: string;
  status: "agendada" | "pendente" | "concluida" | "cancelada" | "rascunho" | "aguardando_aprovacao";
  cep?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  complemento?: string;
  data_agendamento: string | null;
  relatorio_url: string | null;
  created_at: string;
}

import { useNavigate } from "react-router-dom";

const VistoriasPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vistorias, setVistorias] = useState<Vistoria[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchVistorias = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, imobiliaria_id')
        .eq('id', user.id)
        .single();

      const imobiliariaId = profile?.imobiliaria_id || profile?.id;

      const { data, error } = await supabase
        .from("vistorias")
        .select("*")
        .eq("imobiliaria_id", imobiliariaId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVistorias(data || []);
    } catch (error) {
      console.error("Erro ao buscar vistorias:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVistorias();
  }, []);

  const handleRequestVistoria = () => {
    navigate("/imobiliaria/vistorias/nova");
  };

  const handleOpenPDF = async (url: string | null) => {
    if (url) {
      // 1. Abrir para visualização
      window.open(url, "_blank");
      
      // 2. Trigger Download (Blob approach for best cross-browser support)
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `Vistoria_${new Date().getTime()}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } catch (error) {
        console.error("Erro ao baixar PDF:", error);
      }
    } else {
      toast.error("PDF ainda não disponível.");
    }
  };

  const handleDeleteVistoria = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta vistoria? Esta ação não pode ser desfeita.")) return;
    
    try {
      const { error } = await supabase.from("vistorias").delete().eq("id", id);
      if (error) throw error;
      toast.success("Vistoria excluída!");
      fetchVistorias();
    } catch (error) {
      toast.error("Erro ao excluir vistoria.");
    }
  };

  const handleApproveVistoria = async (id: string) => {
    try {
      const { error } = await supabase
        .from("vistorias")
        .update({ status: "concluida" })
        .eq("id", id);
      
      if (error) throw error;
      toast.success("Vistoria aprovada e finalizada!");
      fetchVistorias();
    } catch (error) {
      toast.error("Erro ao aprovar vistoria.");
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      agendada: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      pendente: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      aguardando_aprovacao: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 font-bold",
      concluida: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      cancelada: "bg-destructive/10 text-destructive border-destructive/20",
      rascunho: "bg-muted text-muted-foreground border-muted-foreground/20",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  const formatEndereco = (vistoria: Vistoria) => {
    const parts = [];
    
    // Rua, nº Número
    if (vistoria.rua) {
      let main = vistoria.rua;
      if (vistoria.numero) main += `, nº ${vistoria.numero}`;
      parts.push(main);
    }

    // Complemento (Conditional)
    if (vistoria.complemento && vistoria.complemento.trim()) {
      parts.push(vistoria.complemento.trim());
    }

    // Bairro
    if (vistoria.bairro) {
      parts.push(vistoria.bairro);
    }

    // Cidade/UF
    if (vistoria.cidade) {
      let loc = vistoria.cidade;
      if (vistoria.estado) loc += `/${vistoria.estado}`;
      parts.push(loc);
    }

    // CEP (Conditional)
    const baseline = parts.join(", ");
    let final = baseline.replace(/, ([^,]+)$/, " - $1"); // Replace last comma with dash for Bairro or Cidade separation
    
    // Ajuste fino para o formato solicitado: [Rua], nº [Número], [Complemento] - [Bairro], [Cidade]/[UF] - CEP: [CEP]
    // Vamos reconstruir de forma mais granular para o formato exato:
    const finalParts = [];
    const ruaNum = vistoria.rua ? `${vistoria.rua}${vistoria.numero ? `, nº ${vistoria.numero}` : ''}` : "";
    if (ruaNum) finalParts.push(ruaNum);
    
    if (vistoria.complemento && vistoria.complemento.trim()) finalParts.push(vistoria.complemento.trim());
    
    let result = finalParts.join(", ");
    
    if (vistoria.bairro) {
      result += (result ? " - " : "") + vistoria.bairro;
    }
    
    if (vistoria.cidade) {
      result += (result ? ", " : "") + vistoria.cidade + (vistoria.estado ? `/${vistoria.estado}` : "");
    }
    
    if (vistoria.cep) {
      result += (result ? " - " : "") + `CEP: ${vistoria.cep}`;
    }

    return result || `Vistoria #${vistoria.id.split("-")[0]}`;
  };

  const filteredVistorias = vistorias.filter(v => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    const fullSearchString = `${v.rua} ${v.bairro} ${v.cidade} ${v.complemento} ${v.numero} ${v.id}`.toLowerCase();
    return fullSearchString.includes(search);
  });

  if (loading) {
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
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-heading font-extrabold text-foreground">Vistorias</h1>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold uppercase tracking-wider text-[10px]">
                Plataforma Gestão
              </Badge>
            </div>
            <p className="text-muted-foreground">Realize vistorias profissionais e gere laudos automáticos.</p>
          </div>
          <Button onClick={handleRequestVistoria} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg shadow-secondary/20 font-bold gap-2">
            <Plus className="w-4 h-4" />
            Nova Vistoria
          </Button>
        </div>

        {/* Barra de Busca Dinâmica */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Buscar por rua, bairro, cidade ou complemento..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-10 h-14 bg-background/50 border-border/50 focus-visible:ring-secondary/50 text-base rounded-xl"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {filteredVistorias.length > 0 ? (
              filteredVistorias.map((vistoria) => (
                <Card key={vistoria.id} className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-secondary/30 transition-all group overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center p-6 gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center shrink-0 border border-secondary/20">
                      <ClipboardCheck className="w-8 h-8 text-secondary group-hover:scale-110 transition-transform" />
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <h3 className="font-bold text-base leading-tight md:text-lg max-w-md">
                          {formatEndereco(vistoria)}
                        </h3>
                        <Badge variant="outline" className={`${getStatusColor(vistoria.status)} shrink-0`}>
                          {vistoria.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-4 h-4" />
                          {vistoria.data_agendamento || vistoria.created_at ? new Date(vistoria.data_agendamento || vistoria.created_at).toLocaleDateString() : "Não agendado"}
                        </div>
                        <div className="flex items-center gap-1.5 font-medium">
                          <FileText className="w-4 h-4" />
                          {vistoria.relatorio_url ? "Laudo disponível" : "Laudo em processamento"}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                       <Button variant="ghost" size="sm" className="text-blue-500 hover:bg-blue-500/10"
                         onClick={() => navigate(`/imobiliaria/vistorias/nova?id=${vistoria.id}&view=true`)}>
                         <Eye className="w-4 h-4" />
                       </Button>

                       {vistoria.status === "aguardando_aprovacao" && (
                         <Button onClick={() => handleApproveVistoria(vistoria.id)} size="sm" className="bg-orange-500 hover:bg-orange-600 text-white font-bold">
                           Aprovar
                         </Button>
                       )}

                       {vistoria.status !== "concluida" ? (
                         <>
                           <Button variant="ghost" size="sm" className="text-secondary hover:bg-secondary/10"
                             onClick={() => navigate(`/imobiliaria/vistorias/nova?id=${vistoria.id}`)}>
                             Editar
                           </Button>
                           <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10"
                             onClick={() => handleDeleteVistoria(vistoria.id)}>
                             Excluir
                           </Button>
                         </>
                       ) : (
                         <>
                           <Button variant="ghost" size="sm" className="text-muted-foreground font-bold" disabled>
                             Finalizada
                           </Button>
                           <Button onClick={() => handleOpenPDF(vistoria.relatorio_url)} size="sm" className="bg-secondary text-secondary-foreground font-bold">
                             PDF
                           </Button>
                         </>
                       )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              searchTerm ? (
                /* Empty State de Busca */
                <div className="h-80 flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-3xl bg-muted/5 text-center p-8 animate-in fade-in zoom-in duration-300">
                  <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center mb-4">
                    <SearchX className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                  <h3 className="font-bold text-xl mb-2 italic">Não encontrado</h3>
                  <p className="text-muted-foreground max-w-sm mb-8">
                    Nenhuma vistoria encontrada para este endereço. <br />
                    Tente buscar pelo bairro ou rua de forma simplificada.
                  </p>
                  <Button variant="secondary" onClick={() => setSearchTerm("")} className="font-bold px-8 rounded-full">
                    Limpar Busca
                  </Button>
                </div>
              ) : (
                /* Empty State Geral */
                <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-2xl bg-muted/5 text-center p-8">
                  <ClipboardCheck className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <h3 className="font-bold text-lg mb-2">Nenhuma vistoria realizada</h3>
                  <p className="text-muted-foreground max-w-xs mb-6">
                    Comece sua primeira vistoria profissional agora mesmo. Use nosso sistema e app de campo para gerar laudos automáticos.
                  </p>
                  <Button variant="outline" onClick={handleRequestVistoria}>Iniciar Vistoria</Button>
                </div>
              )
            )}
          </div>

          <div className="space-y-6">
            <Card className="border-border/50 bg-secondary/5 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg">Como funciona?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { step: "01", title: "Cadastro", desc: "Insira os dados do imóvel e locatário no portal." },
                    { step: "02", title: "Vistoria", desc: "Use o checklist no celular para detalhar os ambientes." },
                    { step: "03", title: "Fotos", desc: "Capture fotos otimizadas diretamente pelo sistema." },
                    { step: "04", title: "Laudo", desc: "O PDF oficial é gerado instantaneamente após finalizar." },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <span className="text-xl font-bold text-secondary/30">{item.step}</span>
                      <div>
                        <p className="text-sm font-bold">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                   <h4 className="font-bold mb-2 uppercase tracking-widest text-[10px] text-muted-foreground">Laudos Jurídicos</h4>
                   <p className="text-sm text-foreground/80 mb-4 italic">
                     "Nossa metodologia garante laudos aceitos juridicamente, evitando contestações e trazendo segurança para sua imobiliária."
                   </p>
                   <Button variant="link" className="p-0 h-auto text-secondary font-bold text-[10px] uppercase">Ver Modelo de Laudo</Button>
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VistoriasPage;

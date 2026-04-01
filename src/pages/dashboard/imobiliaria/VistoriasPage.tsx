import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Calendar, FileText, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

interface Vistoria {
  id: string;
  status: "agendada" | "pendente" | "concluida" | "cancelada";
  data_agendamento: string | null;
  relatorio_url: string | null;
  created_at: string;
}

import { useNavigate } from "react-router-dom";

const VistoriasPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vistorias, setVistorias] = useState<Vistoria[]>([]);

  const fetchVistorias = async () => {
    try {
      const { data, error } = await supabase
        .from("vistorias")
        .select("*")
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

  const handleOpenPDF = (url: string | null) => {
    if (url) {
      window.open(url, "_blank");
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

  const getStatusColor = (status: string) => {
    const colors = {
      agendada: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      pendente: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      concluida: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      cancelada: "bg-destructive/10 text-destructive border-destructive/20",
      rascunho: "bg-muted text-muted-foreground border-muted-foreground/20",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

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

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {vistorias.length > 0 ? (
              vistorias.map((vistoria) => (
                <Card key={vistoria.id} className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-secondary/30 transition-all group overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center p-6 gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center shrink-0 border border-secondary/20">
                      <ClipboardCheck className="w-8 h-8 text-secondary group-hover:scale-110 transition-transform" />
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg">Relatório de Vistoria #{vistoria.id.split("-")[0]}</h3>
                        <Badge variant="outline" className={getStatusColor(vistoria.status)}>
                          {vistoria.status}
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
                           <Button variant="ghost" size="sm" className="text-muted-foreground" disabled>
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
              <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-2xl bg-muted/5 text-center p-8">
                <ClipboardCheck className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <h3 className="font-bold text-lg mb-2">Nenhuma vistoria por enquanto</h3>
                <p className="text-muted-foreground max-w-xs mb-6">
                  Comece solicitando sua primeira vistoria gratuita clicando no botão acima.
                </p>
                <Button variant="outline" onClick={handleRequestVistoria}>Solicitar Agora</Button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border-border/50 bg-secondary/5 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg">Como funciona?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { step: "01", title: "Solicitação", desc: "Você preenche os dados do imóvel." },
                    { step: "02", title: "Agendamento", desc: "Nossa equipe confirma a data com o inquilino." },
                    { step: "03", title: "Execução", desc: "O perito realiza a vistoria presencial." },
                    { step: "04", title: "Relatório", desc: "O PDF é liberado aqui no portal em 24h." },
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
                   <h4 className="font-bold mb-2 uppercase tracking-widest text-[10px] text-muted-foreground">Precisa de Reparos?</h4>
                   <p className="text-sm text-foreground/80 mb-4 italic">
                     "Identificamos problemas na vistoria? Oferecemos orçamentos imediatos para reparos."
                   </p>
                   <Button variant="link" className="p-0 h-auto text-secondary font-bold">Saiba mais sobre reparos</Button>
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VistoriasPage;

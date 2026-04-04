import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Calendar, FileText, MessageSquare, Loader2, FileUp, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface InquilinoData {
  id: string;
  nome: string;
  email: string;
  endereco_rua: string;
  endereco_numero: string;
  endereco_complemento: string;
  endereco_bairro: string;
  endereco_cidade: string;
  status_assinatura: string;
  aprovacao_ef: string;
  plano_nome: string;
  plano_mensalidade: number;
  plano_parcelas: number;
  contrato_locacao_url: string;
  vistoria_upload_url: string;
  vistoria_id: string;
  created_at: string;
}

const InquilinoDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [inquilino, setInquilino] = useState<InquilinoData | null>(null);

  useEffect(() => {
    const fetchInquilinoData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) return;

        // Fetch the tenant record by email
        const { data, error } = await supabase
          .from("inquilinos")
          .select("*")
          .eq("email", user.email)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          setInquilino(data as InquilinoData);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do inquilino:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInquilinoData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout role="inquilino">
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!inquilino) {
    return (
      <DashboardLayout role="inquilino">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">Meu Plano</h1>
            <p className="text-muted-foreground">Acompanhe seu plano e status da cobertura EF.</p>
          </div>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">Nenhum contrato encontrado</h2>
            <p className="text-muted-foreground max-w-md">
              Não localizamos nenhum contrato de locação ativo associado ao seu e-mail. Se você acabou de assinar, aguarde alguns minutos ou contate sua imobiliária.
            </p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const isAssinaturaPendente = inquilino.status_assinatura !== "assinado";
  const isAprovacaoPendente = inquilino.status_assinatura === "assinado" && inquilino.aprovacao_ef === "pendente";
  const isAtivo = inquilino.status_assinatura === "assinado" && inquilino.aprovacao_ef === "aprovado";
  const isRecusado = inquilino.aprovacao_ef === "recusado";

  let statusConfig = { bg: "bg-muted", text: "text-muted-foreground", icon: AlertTriangle, label: "Desconhecido" };
  if (isAssinaturaPendente) {
    statusConfig = { bg: "bg-orange-500/10", text: "text-orange-600", icon: Clock, label: "Aguardando Assinatura" };
  } else if (isAprovacaoPendente) {
    statusConfig = { bg: "bg-violet-500/10", text: "text-violet-600", icon: Loader2, label: "Em Análise pela EF" };
  } else if (isAtivo) {
    statusConfig = { bg: "bg-emerald-500/10", text: "text-emerald-600", icon: ShieldCheck, label: "Plano Ativo" };
  } else if (isRecusado) {
    statusConfig = { bg: "bg-destructive/10", text: "text-destructive", icon: AlertTriangle, label: "Plano Recusado" };
  }

  const StatusIcon = statusConfig.icon;

  return (
    <DashboardLayout role="inquilino">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">Meu Plano</h1>
          <p className="text-muted-foreground">Acompanhe seu plano e status da cobertura EF.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Status do Plano */}
          <Card className="lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col h-full">
            <div className={`px-6 py-4 flex items-center justify-between border-b border-border/50 ${statusConfig.bg}`}>
              <div className={`flex items-center gap-2 ${statusConfig.text}`}>
                <StatusIcon className={`w-5 h-5 ${isAprovacaoPendente ? 'animate-spin' : ''}`} />
                <span className="font-bold">{statusConfig.label}</span>
              </div>
              <span className="text-xs font-bold text-muted-foreground bg-background/50 px-3 py-1 rounded-full">
                Contrato: {inquilino.id.split('-')[0].toUpperCase()}
              </span>
            </div>

            <CardContent className="p-8 flex-1 flex flex-col">
              {isAssinaturaPendente && (
                <div className="mb-8 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-start gap-3">
                  <Clock className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-orange-700 dark:text-orange-400">Assinatura Pendente</h4>
                    <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
                      Enviamos o contrato de prestação de serviços para o seu e-mail (<strong>{inquilino.email}</strong>) via Autentique. Por favor, verifique sua caixa de entrada e assine digitalmente para ativar sua cobertura.
                    </p>
                  </div>
                </div>
              )}

              {isAprovacaoPendente && (
                <div className="mb-8 p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-violet-700 dark:text-violet-400">Assinatura Confirmada</h4>
                    <p className="text-sm text-violet-600 dark:text-violet-300 mt-1">
                      Recebemos sua assinatura! Agora o seu contrato e vistoria estão em análise pela equipe da Entrega Facilitada. Você será notificado assim que o plano for ativado.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-8 flex-1">
                <div className="space-y-6">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-bold">Imóvel Protegido</p>
                    <p className="font-bold text-lg leading-tight">
                      {inquilino.endereco_rua}, {inquilino.endereco_numero}
                      {inquilino.endereco_complemento && ` - ${inquilino.endereco_complemento}`}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {inquilino.endereco_bairro}, {inquilino.endereco_cidade}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-bold">Plano Contratado</p>
                    <p className="font-black text-secondary uppercase bg-secondary/10 inline-block px-3 py-1 rounded-sm border border-secondary/20">
                      {inquilino.plano_nome}
                    </p>
                  </div>
                </div>

                <div className="space-y-6 flex flex-col justify-center">
                  <div className="bg-muted/30 p-5 rounded-xl border border-border/50 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-bold">Condição de Pagamento</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-2xl font-bold">{inquilino.plano_parcelas}x</span>
                      <span className="text-xl font-bold text-muted-foreground">R$</span>
                      <span className="text-4xl font-black text-foreground">
                        {inquilino.plano_mensalidade?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {isAtivo && (
                    <Button className="w-full h-12 text-base font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg shadow-secondary/20">
                      Consultar Faturas
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Atalhos Rápidos */}
          <div className="space-y-6 h-full flex flex-col">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm flex-1">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg border-b border-border/50 pb-4">Documentação</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 pt-2">
                {inquilino.contrato_locacao_url && (
                  <Button
                    variant="outline"
                    className="justify-start gap-3 h-14 border-border/50 hover:bg-secondary/5 font-bold hover:text-secondary group"
                    onClick={() => window.open(inquilino.contrato_locacao_url, "_blank")}
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20">
                      <FileUp className="w-4 h-4 text-secondary" />
                    </div>
                    Contrato de Locação
                  </Button>
                )}

                {inquilino.vistoria_upload_url && (
                  <Button
                    variant="outline"
                    className="justify-start gap-3 h-14 border-border/50 hover:bg-emerald-500/5 font-bold hover:text-emerald-500 group"
                    onClick={() => window.open(inquilino.vistoria_upload_url, "_blank")}
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20">
                      <FileText className="w-4 h-4 text-emerald-500" />
                    </div>
                    Laudo de Vistoria
                  </Button>
                )}

                {(!inquilino.vistoria_upload_url && !inquilino.vistoria_id) && (
                  <div className="text-sm text-muted-foreground italic p-3 text-center border border-dashed rounded-lg bg-muted/20">
                    Vistoria indisponível.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm bg-gradient-to-br from-secondary/5 to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Suporte Oficial</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                  Dúvidas sobre sua cobertura financeira ou rescisão inteligente? Nossa equipe está pronta.
                </p>
                <Button className="w-full justify-center gap-2 bg-[#25D366] text-white hover:bg-[#20bd5a] font-bold">
                  <MessageSquare className="w-4 h-4" />
                  Falar no WhatsApp
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Histórico de Pagamentos (Visual Placeholder) */}
        {isAtivo && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm opacity-60 pointer-events-none">
            <CardHeader className="pb-3 border-b border-border/50 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Histórico de Mensalidades</CardTitle>
                  <CardDescription>Acompanhe o status dos seus pagamentos.</CardDescription>
                </div>
                <div className="bg-background/80 px-3 py-1 text-xs font-bold rounded-full border">
                  Em Breve
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-left text-xs uppercase text-muted-foreground font-bold">
                    <tr>
                      <th className="px-6 py-3">Referência</th>
                      <th className="px-6 py-3">Vencimento</th>
                      <th className="px-6 py-3">Valor</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[1, 2, 3].map((v) => (
                      <tr key={v}>
                        <td className="px-6 py-4 font-medium text-muted-foreground">Mês 0{v}</td>
                        <td className="px-6 py-4 text-muted-foreground">10/0{v + 3}/2024</td>
                        <td className="px-6 py-4 font-mono text-muted-foreground">R$ {inquilino.plano_mensalidade?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded text-xs font-bold">Pago</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InquilinoDashboard;


import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, Clock, AlertTriangle, Loader2, FileText,
  CreditCard, Key, MessageSquare, ChevronRight, CheckCircle2, User,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { StatusTracker } from "@/components/dashboard/inquilino/StatusTracker";

interface InquilinoData {
  id: string;
  nome: string;
  status_assinatura: string;
  aprovacao_ef: string;
  plano_nome: string;
  plano_mensalidade: number;
  plano_parcelas: number;
  plano_id: string;
  status_pagamento?: string;
}

interface ProfileData {
  full_name: string;
}

interface SolicitacaoData {
  id: string;
  status: string;
  data_pretendida: string;
}

const quickLinks = [
  {
    href: "/inquilino/contrato",
    Icon: FileText,
    label: "Meu Contrato",
    desc: "Plano, imóvel e documentos EF",
    color: "from-blue-600/10 to-blue-600/5",
    iconBg: "bg-blue-600/10",
    iconColor: "text-blue-600",
  },
  {
    href: "/inquilino/solicitacao",
    Icon: Key,
    label: "Solicitar Entrega",
    desc: "Inicie a entrega do imóvel",
    color: "from-emerald-600/10 to-emerald-600/5",
    iconBg: "bg-emerald-600/10",
    iconColor: "text-emerald-600",
  },
  {
    href: "/inquilino/atendimento",
    Icon: MessageSquare,
    label: "Atendimento",
    desc: "Suporte e Central de Ajuda",
    color: "from-violet-600/10 to-violet-600/5",
    iconBg: "bg-violet-600/10",
    iconColor: "text-violet-600",
  },
  {
    href: "/inquilino/perfil",
    Icon: User,
    label: "Meu Perfil",
    desc: "Dados pessoais e senha",
    color: "from-amber-600/10 to-amber-600/5",
    iconBg: "bg-amber-600/10",
    iconColor: "text-amber-600",
  },
];

const InquilinoDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [inquilino, setInquilino] = useState<InquilinoData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [solicitacao, setSolicitacao] = useState<SolicitacaoData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) return;

        const [{ data: inqRow }, { data: profileRow }] = await Promise.all([
          supabase.from("inquilinos").select("*")
            .eq("email", user.email).order("created_at", { ascending: false }).limit(1).single(),
          supabase.from("profiles").select("full_name").eq("id", user.id).single(),
        ]);

        if (inqRow) {
          setInquilino(inqRow as InquilinoData);
          if (!inqRow.plano_id) {
            navigate("/inquilino/contratar");
            return;
          }

          // Fetch active delivery request
          const { data: solRow } = await supabase
            .from("solicitacoes_entrega")
            .select("id, status, data_pretendida")
            .eq("inquilino_id", inqRow.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          
          if (solRow) setSolicitacao(solRow);
        } else {
          navigate("/inquilino/contratar");
        }
        if (profileRow) setProfile(profileRow as ProfileData);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <DashboardLayout role="inquilino">
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        </div>
      </DashboardLayout>
    );
  }

  const isAssinaturaPendente = !inquilino || inquilino.status_assinatura !== "assinado";
  const isAnalise = inquilino?.status_assinatura === "assinado" && inquilino?.aprovacao_ef === "pendente";
  const isAprovadoPendentePagamento = inquilino?.status_assinatura === "assinado" &&
    inquilino?.aprovacao_ef === "aprovado" &&
    inquilino?.status_pagamento !== "pago";
  const isAtivo = inquilino?.status_assinatura === "assinado" &&
    inquilino?.aprovacao_ef === "aprovado" &&
    inquilino?.status_pagamento === "pago";
  const isRecusado = inquilino?.aprovacao_ef === "recusado";

  const statusConfig = isAtivo
    ? { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-600", Icon: ShieldCheck, label: "Plano Ativo", cta: null, spin: false }
    : isAprovadoPendentePagamento
      ? { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-600", Icon: CreditCard, label: "Plano Aprovado (Pendente Pagamento)", cta: "Sua documentação foi aprovada! Pague a primeira parcela para ativar a cobertura.", spin: false }
      : isAnalise
        ? { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-600", Icon: Loader2, label: "Em Análise pela EF", cta: "Sua documentação está em revisão. Você será notificado sobre a aprovação.", spin: true }
        : isRecusado
          ? { bg: "bg-destructive/10", border: "border-destructive/30", text: "text-destructive", Icon: AlertTriangle, label: "Plano Recusado", cta: "Seu contrato foi recusado. Entre em contato pelo Atendimento.", spin: false }
          : { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-600", Icon: Clock, label: "Aguardando Assinatura", cta: "Enviamos o contrato para seu e-mail via Autentique. Assine para prosseguir.", spin: false };

  const firstName = (profile?.full_name || inquilino?.nome || "Cliente")?.split(" ")[0];
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <DashboardLayout role="inquilino">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Welcome */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-extrabold text-foreground mb-1">
              {greeting}, {firstName}! 👋
            </h1>
            <p className="text-muted-foreground">Bem-vindo ao seu portal de cliente Entrega Facilitada.</p>
          </div>
          {isAtivo && (
            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-4 py-2 rounded-full border border-emerald-500/20 shadow-sm">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Cobertura Ativa</span>
            </div>
          )}
        </div>

        {/* Status Banner */}
        <div className={cn("rounded-2xl border p-5 flex items-start gap-4 shadow-sm", statusConfig.bg, statusConfig.border)}>
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", statusConfig.bg)}>
            <statusConfig.Icon className={cn("w-6 h-6", statusConfig.text, statusConfig.spin && "animate-spin")} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className={cn("font-black text-lg", statusConfig.text)}>{statusConfig.label}</p>
              {inquilino && (
                <span className="text-xs font-bold text-muted-foreground bg-background/60 px-3 py-1 rounded-full border border-border/50">
                  Contrato #{inquilino?.id?.split("-")[0].toUpperCase() || "---"}
                </span>
              )}
            </div>
            {statusConfig.cta && (
              <p className="text-sm text-muted-foreground mt-1 font-medium">{statusConfig.cta}</p>
            )}
            {isAtivo && inquilino && (
              <div className="flex flex-wrap gap-4 mt-2">
                <span className="text-sm font-bold text-foreground/80">
                  Plano: <span className="text-secondary uppercase">{inquilino.plano_nome}</span>
                </span>
                <span className="text-sm font-bold text-foreground/80">
                  {inquilino.plano_parcelas}x R$ {inquilino.plano_mensalidade?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Progress Tracker */}
        {solicitacao && (
          <Card className="border-secondary/20 bg-secondary/5 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-2 border-b border-secondary/10 bg-secondary/10">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Key className="w-5 h-5 text-secondary" /> Progresso da Entrega
                        </CardTitle>
                    </div>
                    {solicitacao.status === 'concluida' ? (
                        <Badge className="bg-emerald-500 text-white font-bold">Concluído</Badge>
                    ) : (
                        <Badge className="bg-secondary text-white font-bold animate-pulse">Em Processo</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <StatusTracker 
                    currentStatus={solicitacao.status} 
                    dataPretendida={solicitacao.data_pretendida} 
                />
            </CardContent>
          </Card>
        )}

        {/* Quick Links Grid */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-4 ml-1">Acesso Rápido</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((item) => (
              <Link key={item.href} to={item.href}>
                <Card className={cn(
                  "border-border/50 bg-gradient-to-br backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group",
                  item.color
                )}>
                  <CardContent className="pt-6 pb-5">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", item.iconBg)}>
                      <item.Icon className={cn("w-5 h-5", item.iconColor)} />
                    </div>
                    <p className="font-bold text-base">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-4 leading-relaxed">{item.desc}</p>
                    <div className={cn("flex items-center gap-1 text-xs font-bold", item.iconColor)}>
                      Acessar <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Next Step Card */}
        {!isAtivo && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg">
            <CardContent className="pt-6 pb-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-4">Próximo Passo</p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {isAssinaturaPendente && (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg">Assine o Contrato EF</p>
                      <p className="text-sm text-muted-foreground mt-1 font-medium">
                        Verifique seu e-mail — enviamos o contrato via Autentique. Após a assinatura digital, sua cobertura entra em análise.
                      </p>
                    </div>
                  </>
                )}
                {isAnalise && (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-violet-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg text-violet-500">Assinatura Confirmada — Em Análise</p>
                      <p className="text-sm text-muted-foreground mt-1 font-medium">
                        Sua documentação foi recebida e está sendo revisada. Você será notificado sobre a aprovação.
                      </p>
                    </div>
                  </>
                )}
                {isAprovadoPendentePagamento && (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg text-amber-600">Libere seu Plano — Pague a 1ª Parcela</p>
                      <p className="text-sm text-muted-foreground mt-1 font-medium">
                        A documentação foi aprovada! Faça o pagamento da primeira parcela para ativar sua cobertura imediatamente.
                      </p>
                    </div>
                  </>
                )}
                <Button
                  variant="default"
                  size="lg"
                  className="font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg shadow-secondary/20 whitespace-nowrap shrink-0 h-12 px-6 rounded-xl"
                  asChild
                >
                  <Link to="/inquilino/contrato">Ver Meu Contrato</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </DashboardLayout>
  );
};

export default InquilinoDashboard;

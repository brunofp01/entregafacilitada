import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck, Clock, AlertTriangle, Loader2, FileText,
  CreditCard, Key, MessageSquare, ChevronRight, CheckCircle2, User,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface InquilinoData {
  id: string;
  nome: string;
  status_assinatura: string;
  aprovacao_ef: string;
  plano_nome: string;
  plano_mensalidade: number;
  plano_parcelas: number;
}

interface ProfileData {
  full_name: string;
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) return;

        const [{ data: inqRow }, { data: profileRow }] = await Promise.all([
          supabase.from("inquilinos").select("id, nome, status_assinatura, aprovacao_ef, plano_nome, plano_mensalidade, plano_parcelas, plano_id")
            .eq("email", user.email).order("created_at", { ascending: false }).limit(1).single(),
          supabase.from("profiles").select("full_name").eq("id", user.id).single(),
        ]);

        if (inqRow) {
          setInquilino(inqRow as InquilinoData);
          // If no plan is selected yet, redirect to hiring page
          if (!inqRow.plano_id) {
            navigate("/inquilino/contratar");
          }
        } else {
          // No inquilino record at all? Also redirect
          navigate("/inquilino/contratar");
        }
        if (profileRow) setProfile(profileRow as ProfileData);
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
  const isAtivo = inquilino?.status_assinatura === "assinado" && inquilino?.aprovacao_ef === "aprovado";
  const isRecusado = inquilino?.aprovacao_ef === "recusado";

  const statusConfig = isAtivo
    ? { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-600", Icon: ShieldCheck, label: "Plano Ativo", cta: null, spin: false }
    : isAnalise
      ? { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-600", Icon: Loader2, label: "Em Análise pela EF", cta: "Sua documentação está em revisão. Você será notificado quando o plano for ativado.", spin: true }
      : isRecusado
        ? { bg: "bg-destructive/10", border: "border-destructive/30", text: "text-destructive", Icon: AlertTriangle, label: "Plano Recusado", cta: "Seu contrato foi recusado. Entre em contato pelo Atendimento.", spin: false }
        : { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-600", Icon: Clock, label: "Aguardando Assinatura", cta: "Enviamos o contrato para seu e-mail via Autentique. Por favor, assine para ativar sua cobertura.", spin: false };

  const firstName = (profile?.full_name || inquilino?.nome || "Cliente")?.split(" ")[0];
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <DashboardLayout role="inquilino">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Welcome */}
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-foreground mb-1">
            {greeting}, {firstName}! 👋
          </h1>
          <p className="text-muted-foreground">Bem-vindo ao seu portal de cliente Entrega Facilitada.</p>
        </div>

        {/* Status Banner */}
        <div className={cn("rounded-2xl border p-5 flex items-start gap-4", statusConfig.bg, statusConfig.border)}>
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
              <p className="text-sm text-muted-foreground mt-1">{statusConfig.cta}</p>
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

        {/* Quick Links Grid */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-4">Acesso Rápido</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((item) => (
              <Link key={item.href} to={item.href}>
                <Card className={cn(
                  "border-border/50 bg-gradient-to-br backdrop-blur-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group",
                  item.color
                )}>
                  <CardContent className="pt-6 pb-5">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", item.iconBg)}>
                      <item.Icon className={cn("w-5 h-5", item.iconColor)} />
                    </div>
                    <p className="font-bold text-base">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-4 leading-relaxed">{item.desc}</p>
                    <div className={cn("flex items-center gap-1 text-xs font-bold", item.iconColor)}>
                      Acessar <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Next Step Card */}
        {!isAtivo && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6 pb-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-4">Próximo Passo</p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {isAssinaturaPendente && (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">Assine o Contrato EF</p>
                      <p className="text-sm text-muted-foreground mt-1">
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
                      <p className="font-bold">Assinatura Confirmada — Em Análise</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Sua documentação foi recebida e está sendo revisada. Você será notificado quando o plano for ativado.
                      </p>
                    </div>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="font-bold border-border/50 hover:text-secondary whitespace-nowrap shrink-0"
                  asChild
                >
                  <Link to="/inquilino/contrato">Ver Contrato</Link>
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

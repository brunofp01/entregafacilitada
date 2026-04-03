import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, FileText, ClipboardCheck, UserPlus, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

const ImobiliariaDashboard = () => {
  const [userRole, setUserRole] = useState<string>(localStorage.getItem('userRole') || "imobiliaria");

  const [stats, setStats] = useState({ total: 0, pending: 0, signed: 0, awaitingEF: 0, rejected: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('role, imobiliaria_id').eq('id', user.id).single();
      if (profile?.role) setUserRole(profile.role);

      const imobiliariaId = profile?.imobiliaria_id || user.id;

      const { data: inqs } = await supabase
        .from('inquilinos')
        .select('status_assinatura, aprovacao_ef')
        .eq('imobiliaria_id', imobiliariaId);

      if (inqs) {
        setStats({
          total: inqs.length,
          pending: inqs.filter(i => i.status_assinatura === 'pendente').length,
          signed: inqs.filter(i => i.status_assinatura === 'assinado').length,
          awaitingEF: inqs.filter(i => i.status_assinatura === 'assinado' && (!i.aprovacao_ef || i.aprovacao_ef === 'pendente')).length,
          rejected: inqs.filter(i => i.status_assinatura === 'recusado' || i.aprovacao_ef === 'recusado').length,
        });
      }
      setLoadingStats(false);
    };
    fetchData();
  }, []);

  const isIntegrante = userRole === "integrante_imobiliaria";

  const allModules = [
    {
      title: "Gestão de Inquilinos com Entrega Facilitada",
      description: "Visualize e gerencie todos os inquilinos vinculados à sua imobiliária.",
      icon: Users,
      href: "/imobiliaria/inquilinos",
      color: "bg-blue-500/10 text-blue-500",
      restrictedOnly: false,
    },
    {
      title: "Módulo de Vistoria",
      description: "Solicite vistorias gratuitas e acompanhe o status dos relatórios.",
      icon: ClipboardCheck,
      href: "/imobiliaria/vistorias",
      color: "bg-emerald-500/10 text-emerald-500",
      badge: "Grátis",
      restrictedOnly: false,
    },
    {
      title: "Minha Equipe",
      description: "Adicione funcionários e gerencie acessos da sua organização.",
      icon: UserPlus,
      href: "/imobiliaria/equipe",
      color: "bg-purple-500/10 text-purple-500",
      ownerOnly: true,
    },
    {
      title: "Seguros e Garantias",
      description: "Consulte apólices e coberturas ativas dos seus imóveis.",
      icon: Shield,
      href: "/imobiliaria/seguros",
      color: "bg-orange-500/10 text-orange-500",
      restrictedOnly: false,
    },
    {
      title: "Perfil da Imobiliária",
      description: "Configure sua logo e dados de contato para os laudos.",
      icon: FileText,
      href: "/imobiliaria/perfil",
      color: "bg-pink-500/10 text-pink-500",
      ownerOnly: true,
    },
  ];

  const modules = allModules.filter(m => !m.ownerOnly || !isIntegrante);

  return (
    <DashboardLayout role={userRole as "imobiliaria" | "integrante_imobiliaria"}>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">Portal da Imobiliária</h1>
            <p className="text-muted-foreground">Bem-vindo ao seu centro de gestão e vistorias.</p>
          </div>
          <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg shadow-secondary/20 font-bold">
            <Link to="/imobiliaria/contratar">Contratar Entrega Facilitada</Link>
          </Button>
        </div>

        {/* Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Total de Inquilinos</CardDescription>
              <CardTitle className="text-2xl font-black">{loadingStats ? "..." : stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-orange-500">Pendentes</CardDescription>
              <CardTitle className="text-2xl font-black text-orange-500">{loadingStats ? "..." : stats.pending}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-violet-500">Aguardando EF</CardDescription>
              <CardTitle className="text-2xl font-black text-violet-500">{loadingStats ? "..." : stats.awaitingEF}</CardTitle>
            </CardHeader>
          </Card>
          <Card className={stats.rejected > 0 ? "border-red-500/20 bg-red-500/10" : "border-border/50 bg-card/40"}>
            <CardHeader className="p-4 pb-2">
              <CardDescription className={`text-[10px] font-bold uppercase tracking-wider ${stats.rejected > 0 ? "text-red-600" : "text-muted-foreground"}`}>Recusados</CardDescription>
              <CardTitle className={`text-2xl font-black ${stats.rejected > 0 ? "text-red-600" : "text-muted-foreground"}`}>{loadingStats ? "..." : stats.rejected}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {modules.map((module, i) => (
            <Link key={i} to={module.href}>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-secondary/30 transition-all group h-full">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className={i % 2 === 0 ? "space-y-1" : "space-y-1"}>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl font-bold italic">{module.title}</CardTitle>
                      {module.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                          {module.badge}
                        </span>
                      )}
                    </div>
                    <CardDescription className="text-sm leading-relaxed">
                      {module.description}
                    </CardDescription>
                  </div>
                  <div className={`p-3 rounded-xl ${module.color} group-hover:scale-110 transition-transform`}>
                    <module.icon className="w-6 h-6" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm font-bold text-secondary group-hover:translate-x-1 transition-transform">
                    Acessar módulo <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-4">
              <h2 className="text-2xl font-bold">Precisando de suporte?</h2>
              <p className="text-muted-foreground">
                Nossa equipe técnica está pronta para ajudar com vistorias complexas,
                dúvidas sobre a plataforma ou integrações de API.
              </p>
              <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary/10">
                Falar com Especialista
              </Button>
            </div>
            <div className="w-full md:w-1/3 aspect-video bg-gradient-to-br from-secondary/20 to-primary/20 rounded-2xl border border-secondary/20 flex items-center justify-center p-6 text-center">
              <p className="text-xs font-medium text-muted-foreground italic">
                "A Entrega Facilitada reduziu nosso tempo de vistoria em 70%."
                <br />— Imobiliária Exemplo
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ImobiliariaDashboard;

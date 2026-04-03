import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, FileText, ClipboardCheck, UserPlus, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

const ImobiliariaDashboard = () => {
  const [userRole, setUserRole] = useState<string>(localStorage.getItem('userRole') || "imobiliaria");

  const [stats, setStats] = useState({
    vistoriasAprovadas: 0,
    pendentesAprovacao: 0,
    contratosAtivos: 0,
    pendentesAssinatura: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('role, imobiliaria_id').eq('id', user.id).single();
      if (profile?.role) setUserRole(profile.role);

      const imobiliariaId = profile?.imobiliaria_id || user.id;

      // Buscar Inquilinos (Contratos)
      const { data: inqs } = await supabase
        .from('inquilinos')
        .select('status_assinatura, aprovacao_ef')
        .eq('imobiliaria_id', imobiliariaId);

      // Buscar Vistorias
      const { data: vists } = await supabase
        .from('vistorias')
        .select('status')
        .eq('imobiliaria_id', imobiliariaId);

      if (inqs) {
        setStats({
          vistoriasAprovadas: vists?.filter(v => v.status === 'concluida').length || 0,
          pendentesAprovacao: vists?.filter(v => v.status !== 'concluida').length || 0,
          contratosAtivos: inqs.filter(i => i.status_assinatura === 'assinado' && i.aprovacao_ef === 'aprovado').length,
          pendentesAssinatura: inqs.filter(i => i.status_assinatura !== 'assinado' && i.status_assinatura !== 'rejeitado').length,
        });
      }
      setLoadingStats(false);
    };
    fetchData();
  }, []);

  const isIntegrante = userRole === "integrante_imobiliaria";

  const allModules = [
    {
      title: "Gestão de Clientes EF",
      description: "Acompanhe os contratos, assinaturas e status de aprovação.",
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
          <Card className="border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Vistorias Aprovadas</CardDescription>
              <CardTitle className="text-2xl font-black text-emerald-600">{loadingStats ? "..." : stats.vistoriasAprovadas}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-violet-500/20 bg-violet-500/5 backdrop-blur-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-violet-600">Vistorias Pendentes de Aprovação</CardDescription>
              <CardTitle className="text-2xl font-black text-violet-600">{loadingStats ? "..." : stats.pendentesAprovacao}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-secondary/20 bg-secondary/5 backdrop-blur-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-secondary">EF: Contratos Ativos</CardDescription>
              <CardTitle className="text-2xl font-black text-secondary">{loadingStats ? "..." : stats.contratosAtivos}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-orange-500/20 bg-orange-500/5 backdrop-blur-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-orange-600">EF:Pendentes de Assinatura</CardDescription>
              <CardTitle className="text-2xl font-black text-orange-600">{loadingStats ? "..." : stats.pendentesAssinatura}</CardTitle>
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

      </div>
    </DashboardLayout>
  );
};

export default ImobiliariaDashboard;

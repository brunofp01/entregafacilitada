import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Loader2,
  Search,
  Filter,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from "recharts";

interface Stats {
  imobiliarias: number;
  usuarios: number;
  receita: string;
  crescimento: string;
}

interface Imobiliaria {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
}

const chartData = [
  { name: "Jan", imobs: 4, inquilinos: 12 },
  { name: "Fev", imobs: 7, inquilinos: 25 },
  { name: "Mar", imobs: 10, inquilinos: 42 },
  { name: "Abr", imobs: 15, inquilinos: 68 },
];

const roleDistribution = [
  { name: "Imobiliárias", value: 15, color: "#10b981" },
  { name: "Inquilinos", value: 68, color: "#ec4899" },
  { name: "Equipe", value: 24, color: "#3b82f6" },
];

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    imobiliarias: 0,
    usuarios: 0,
    receita: "R$ 0",
    crescimento: "0%",
  });
  const [imobiliariasList, setImobiliariasList] = useState<Imobiliaria[]>([]);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Fetch real stats from database
        const { count: imobiliariasCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "imobiliaria");

        const { count: usuariosCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        setStats({
          imobiliarias: imobiliariasCount || 0,
          usuarios: usuariosCount || 0,
          receita: "R$ 45.200", // Mocado por enquanto
          crescimento: "+12%",  // Mocado por enquanto
        });

        // Fetch recent imobiliarias
        const { data: imobiliarias } = await supabase
          .from("profiles")
          .select("id, full_name, email, updated_at")
          .eq("role", "imobiliaria")
          .order("updated_at", { ascending: false })
          .limit(5);

        if (imobiliarias) {
          setImobiliariasList(imobiliarias.map(i => ({
            id: i.id,
            full_name: i.full_name,
            email: i.email,
            created_at: i.updated_at || new Date().toISOString()
          })));
        }

      } catch (error) {
        console.error("Erro ao buscar dados do admin:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const statsCards = [
    { title: "Total de Imobiliárias", value: stats.imobiliarias.toString(), icon: Building2, color: "text-blue-500" },
    { title: "Usuários Totais", value: stats.usuarios.toString(), icon: Users, color: "text-green-500" },
    { title: "Receita Mensal", value: stats.receita, icon: DollarSign, color: "text-secondary" },
    { title: "Crescimento", value: stats.crescimento, icon: TrendingUp, color: "text-purple-500" },
  ];

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2 text-balance">Painel de Controle Master</h1>
            <p className="text-muted-foreground">Visão holística e métricas de crescimento da Entrega Facilitada.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2 bg-background/50 border-border/50">
              <Filter className="w-4 h-4" />
              Período
            </Button>
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg shadow-secondary/20">
              Gerar Relatório
            </Button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, i) => (
            <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-secondary/30 transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                <stat.icon className="w-12 h-12" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={`w-5 h-5 ${stat.color} group-hover:scale-110 transition-transform`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold italic">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-secondary" /> Crescimento do Ecossistema
                </CardTitle>
                <p className="text-sm text-muted-foreground">Evolução de imobiliárias e inquilinos nos últimos meses.</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorImobs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorInqs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888810" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#888888', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#888888', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="imobs"
                      stroke="#ec4899"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorImobs)"
                      name="Imobiliárias"
                    />
                    <Area
                      type="monotone"
                      dataKey="inquilinos"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorInqs)"
                      name="Inquilinos"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-secondary" /> Distribuição de Perfis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {roleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 pt-4">
                {roleDistribution.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 pt-4">
          <Card className="lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Imobiliárias Recentes</CardTitle>
                <p className="text-sm text-muted-foreground">Gerenciamento das imobiliárias cadastradas.</p>
              </div>
              <div className="relative w-full max-w-[200px] hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar..." className="pl-9 bg-background/50 border-border/50 text-xs h-9" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto rounded-lg border border-border/50">
                <table className="w-full text-sm text-left text-foreground">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                    <tr>
                      <th className="px-4 py-3">Nome</th>
                      <th className="px-4 py-3">E-mail</th>
                      <th className="px-4 py-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {imobiliariasList.length > 0 ? (
                      imobiliariasList.map((imob) => (
                        <tr key={imob.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-semibold">{imob.full_name || "Sem nome"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{imob.email}</td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" size="sm" className="text-secondary hover:text-secondary hover:bg-secondary/10">
                              Ver Detalhes
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-4 py-10 text-center text-muted-foreground italic">
                          Nenhuma imobiliária cadastrada ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-secondary/5 border-b border-border/50">
              <CardTitle className="text-lg">Atividades Recentes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-4 flex gap-4 hover:bg-muted/10 transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Nova imobiliária cadastrada</p>
                      <p className="text-xs text-muted-foreground">Há {i * 2} horas atrás</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-border/50">
                <Button variant="ghost" className="w-full text-xs text-secondary hover:bg-secondary/10">
                  Ver Todo o Histórico
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;


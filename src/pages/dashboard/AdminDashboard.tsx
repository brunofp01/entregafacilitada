import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, DollarSign, TrendingUp } from "lucide-react";

const AdminDashboard = () => {
  const stats = [
    { title: "Total de Imobiliárias", value: "24", icon: Building2, color: "text-blue-500" },
    { title: "Usuários Ativos", value: "1,240", icon: Users, color: "text-green-500" },
    { title: "Receita Mensal", value: "R$ 45.200", icon: DollarSign, color: "text-secondary" },
    { title: "Crescimento", value: "+12%", icon: TrendingUp, color: "text-purple-500" },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">Painel Administrativo</h1>
          <p className="text-muted-foreground">Visão geral do ecossistema Entrega Facilitada.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Imobiliárias Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Lista de imobiliárias cadastradas recentemente no sistema.</p>
            {/* Tabela ou lista aqui no futuro */}
            <div className="h-40 flex items-center justify-center border-2 border-dashed border-border rounded-lg mt-4">
              Gerenciamento de Imobiliárias em breve
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;

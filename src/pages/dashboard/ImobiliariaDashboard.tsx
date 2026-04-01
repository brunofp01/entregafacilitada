import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, FileText, TrendingUp, Handshake, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const ImobiliariaDashboard = () => {
  const stats = [
    { title: "Inquilinos Ativos", value: "86", icon: Users, color: "text-blue-500" },
    { title: "Contratos Pendentes", value: "4", icon: FileText, color: "text-orange-500" },
    { title: "Taxa de Conversão", value: "68%", icon: TrendingUp, color: "text-emerald-500" },
    { title: "Sucesso de Entrega", value: "98%", icon: Handshake, color: "text-secondary" },
  ];

  return (
    <DashboardLayout role="imobiliaria">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">Portal da Imobiliária</h1>
            <p className="text-muted-foreground">Gerencie seus inquilinos e monitore o status das desocupações.</p>
          </div>
          <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg shadow-secondary/20 font-bold">
            Novo Inquilino
          </Button>
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

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Inquilinos em Foco</CardTitle>
              <CardDescription>Acompanhamento das próximas desocupações.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-40 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                Lista de Inquilinos vindo em breve
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Suporte</CardTitle>
              <CardDescription>Canal direto com a Entrega Facilitada.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Precisa de ajuda com uma vistoria ou negociação? Nossa equipe está à disposição.
              </p>
              <Button variant="outline" className="w-full gap-2 transition-colors hover:bg-secondary/10">
                <Mail className="w-4 h-4" />
                Dúvidas ou Chamados
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ImobiliariaDashboard;

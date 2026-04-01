import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Calendar, FileText, Wrench, MessageSquare } from "lucide-react";

const InquilinoDashboard = () => {
  return (
    <DashboardLayout role="inquilino">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">Meu Plano</h1>
          <p className="text-muted-foreground">Gerencie sua desocupação garantida e acompanhe o status.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Status do Plano */}
          <Card className="lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="bg-secondary/10 px-6 py-4 flex items-center justify-between border-b border-border/50">
              <div className="flex items-center gap-2 text-secondary">
                <ShieldCheck className="w-5 h-5" />
                <span className="font-bold">Plano Ativo</span>
              </div>
              <span className="text-xs font-medium text-muted-foreground">ID #123456</span>
            </div>
            <CardContent className="p-8">
              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Imóvel</p>
                    <p className="font-bold">Rua das Flores, 123 — Apto 45</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Vencimento da Parcela</p>
                    <p className="font-bold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-secondary" />
                      10 de Abril, 2024
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Valor Mensal</p>
                    <p className="text-2xl font-bold italic text-secondary">R$ 55,00</p>
                  </div>
                  <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg shadow-secondary/20">
                    Pagar Parcela
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Atalhos Rápidos */}
          <div className="space-y-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Button variant="outline" className="justify-start gap-3 h-12 border-border/50 transition-colors hover:bg-secondary/10">
                  <Wrench className="w-4 h-4 text-secondary" />
                  Solicitar Manutenção
                </Button>
                <Button variant="outline" className="justify-start gap-3 h-12 border-border/50 transition-colors hover:bg-secondary/10">
                  <FileText className="w-4 h-4 text-purple-500" />
                  Ver Contrato
                </Button>
                <Button variant="outline" className="justify-start gap-3 h-12 border-border/50 transition-colors hover:bg-secondary/10">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  Falar no Chat
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Suporte</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Dúvidas sobre sua cobertura? Entre em contato pelo WhatsApp (11) 99999-9999.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Histórico de Pagamentos</CardTitle>
            <CardDescription>Confira todas as suas parcelas pagas e pendentes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-center justify-center border-2 border-dashed border-border rounded-lg text-muted-foreground text-sm">
              Tabela de pagamentos em breve
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default InquilinoDashboard;

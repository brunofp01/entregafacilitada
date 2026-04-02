import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const RelatoriosPage = () => {
    return (
        <DashboardLayout role="admin">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <header>
                    <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">Relatórios Disponíveis</h1>
                    <p className="text-muted-foreground">Analise as métricas de crescimento e saúde da plataforma.</p>
                </header>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                            <FileText className="w-8 h-8 text-secondary mb-2" />
                            <CardTitle>Crescimento Mensal</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">Relatório detalhado de novas imobiliárias e inquilinos por mês.</p>
                            <Button variant="outline" className="w-full gap-2 italic text-xs">
                                <Download className="w-3 h-3" /> Em breve
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                            <TrendingUp className="w-8 h-8 text-emerald-500 mb-2" />
                            <CardTitle>Conversão de Contratos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">Taxa de assinatura e finalização de contratos via Autentique.</p>
                            <Button variant="outline" className="w-full gap-2 italic text-xs">
                                <Download className="w-3 h-3" /> Em breve
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default RelatoriosPage;

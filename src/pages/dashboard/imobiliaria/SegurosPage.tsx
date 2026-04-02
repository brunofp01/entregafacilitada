import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, ShieldAlert, FileSearch, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const SegurosPage = () => {
    return (
        <DashboardLayout role="imobiliaria">
            <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <header className="mb-8">
                    <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2 text-orange-500 flex items-center gap-3">
                        <Shield className="w-8 h-8" /> Seguros e Garantias
                    </h1>
                    <p className="text-muted-foreground">Consulte coberturas, apólices e status das garantias locatícias ativas.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <ShieldAlert className="w-8 h-8 text-orange-500 mb-2" />
                            <CardTitle className="text-lg">Acionar Cobertura</CardTitle>
                            <CardDescription>Inicie um processo de sinistro ou desocupação.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold">Solicitar</Button>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <FileSearch className="w-8 h-8 text-blue-500 mb-2" />
                            <CardTitle className="text-lg">Consultar Apólices</CardTitle>
                            <CardDescription>Busque por documentos de garantia específica.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" className="w-full">Buscar</Button>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <HelpCircle className="w-8 h-8 text-purple-500 mb-2" />
                            <CardTitle className="text-lg">Central de Ajuda</CardTitle>
                            <CardDescription>Entenda como funcionam as proteções.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="secondary" className="w-full">Acessar</Button>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl p-12 text-center">
                    <div className="max-w-md mx-auto space-y-4">
                        <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-8 h-8 text-orange-500" />
                        </div>
                        <h2 className="text-2xl font-bold italic">Dashboard de Apólices</h2>
                        <p className="text-muted-foreground">
                            Você ainda não possui seguros ativos ou garantias vinculadas neste módulo.
                            Contrate o **Entrega Facilitada** para começar a visualizar suas proteções aqui.
                        </p>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default SegurosPage;

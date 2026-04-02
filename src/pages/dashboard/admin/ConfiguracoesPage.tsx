import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, Shield, Bell, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

const ConfiguracoesPage = () => {
    return (
        <DashboardLayout role="admin">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <header>
                    <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">Painel de Configurações</h1>
                    <p className="text-muted-foreground">Ajustes estruturais e técnicos da Entrega Facilitada.</p>
                </header>

                <div className="grid gap-6">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-secondary" /> Segurança e Permissões
                            </CardTitle>
                            <CardDescription>Gerencie políticas globais de acesso e RBAC.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" className="italic text-xs">Módulo em desenvolvimento</Button>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="w-5 h-5 text-emerald-500" /> Integrações
                            </CardTitle>
                            <CardDescription>Configuração de chaves de API e Webhooks (Autentique, Vercel, SMS).</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" className="italic text-xs">Módulo em desenvolvimento</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ConfiguracoesPage;

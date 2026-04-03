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

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl p-20 text-center flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-6">
                        <Shield className="w-10 h-10 text-orange-500 animate-pulse" />
                    </div>
                    <h2 className="text-3xl font-heading font-bold mb-4 italic">Em desenvolvimento</h2>
                    <p className="text-muted-foreground max-w-md text-lg">
                        Estamos preparando um novo cockpit para gestão de apólices e garantias.
                        Em breve, você poderá contratar e gerenciar seus seguros diretamente pela plataforma,
                        com apenas alguns cliques.
                    </p>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default SegurosPage;

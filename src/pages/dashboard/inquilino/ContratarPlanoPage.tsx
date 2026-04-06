import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Sparkles, Shield, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const availablePlans = [
    {
        id: "basico",
        name: "Plano Básico",
        price: 128.81,
        desc: "Ideal para imóveis residenciais de pequeno porte.",
        features: ["Certificado EF", "Garantia de Pintura", "Reparos Hidráulicos", "Suporte 24h"],
        popular: true
    },
    {
        id: "premium",
        name: "Plano Premium",
        price: 249.90,
        desc: "Cobertura total para casas e apartamentos amplos.",
        features: ["Tudo do Básico", "Limpeza Profissional", "Reparos Elétricos", "Fotos de Alta Resolução"],
        popular: false
    }
];

const ContratarPlanoPage = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSelectPlan = async (plan: typeof availablePlans[0]) => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            // Update the inquilino record with the selected plan
            const { error } = await supabase
                .from("inquilinos")
                .update({
                    plano_id: plan.id,
                    plano_nome: plan.name,
                    plano_mensalidade: plan.price,
                    plano_parcelas: 24, // Standard
                    aprovacao_ef: 'pendente'
                })
                .eq("email", user.email);

            if (error) throw error;

            toast.success(`Excelente escolha! Seu plano ${plan.name} foi selecionado.`);
            navigate("/inquilino");
        } catch (error: any) {
            console.error("Erro contrato:", error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout role="inquilino">
            <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20 text-xs font-black uppercase tracking-widest">
                        <Sparkles className="w-3.5 h-3.5" /> Escolha sua Proteção
                    </div>
                    <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight">
                        Seja bem-vindo à <span className="text-secondary">Entrega Facilitada</span>
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Você ainda não possui um plano ativo. Selecione uma opção abaixo para ativar sua garantia e facilitar a devolução das chaves.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
                    {availablePlans.map((plan) => (
                        <Card key={plan.id} className={cn(
                            "relative flex flex-col border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]",
                            plan.popular && "border-secondary/50 shadow-2xl shadow-secondary/5 ring-1 ring-secondary/20"
                        )}>
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                                    Mais Recomendado
                                </div>
                            )}
                            <CardHeader className="space-y-1 pb-8">
                                <CardTitle className="text-2xl font-black">{plan.name}</CardTitle>
                                <CardDescription className="text-sm font-medium leading-relaxed">{plan.desc}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-8">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black">R$ {plan.price.toFixed(2)}</span>
                                    <span className="text-muted-foreground text-sm font-bold">/mês</span>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">O que está incluído:</p>
                                    <ul className="space-y-3">
                                        {plan.features.map((feat) => (
                                            <li key={feat} className="flex items-center gap-3 text-sm font-medium">
                                                <div className="bg-emerald-500/10 p-1 rounded">
                                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                </div>
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <Button
                                    onClick={() => handleSelectPlan(plan)}
                                    disabled={loading}
                                    className={cn(
                                        "w-full h-12 font-black text-base transition-all",
                                        plan.popular ? "bg-secondary text-secondary-foreground hover:bg-secondary/90" : "bg-primary text-primary-foreground hover:bg-primary/90"
                                    )}
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    ) : (
                                        <Rocket className="w-5 h-5 mr-2" />
                                    )}
                                    Contratar Agora
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="text-center pt-8">
                    <div className="inline-flex items-center gap-6 px-8 py-4 bg-muted/30 rounded-2xl border border-border/50 text-muted-foreground text-sm font-bold">
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-emerald-500" /> Pagamento Seguro (Stripe)
                        </div>
                        <div className="w-px h-4 bg-border/50 hidden sm:block" />
                        <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-secondary" /> Sem Taxas Escondidas
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ContratarPlanoPage;

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";

const SuccessPage = () => {
    const navigate = useNavigate();

    React.useEffect(() => {
        // Celebrate!
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f97316', '#0ea5e9', '#22c55e']
        });
    }, []);

    const userEmail = sessionStorage.getItem("pending_lead_email") || "seu e-mail cadastrado";

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl w-full bg-card border border-border rounded-3xl p-8 md:p-12 shadow-2xl text-center"
            >
                <div className="flex justify-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                        className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center"
                    >
                        <CheckCircle2 className="w-12 h-12 text-success" />
                    </motion.div>
                </div>

                <h1 className="text-3xl md:text-5xl font-heading font-black text-foreground mb-6 leading-tight">
                    Tudo certo! <br />
                    <span className="text-secondary text-2xl md:text-3xl">Seu processo de Entrega Facilitada foi iniciado.</span>
                </h1>

                <div className="space-y-8 text-left max-w-lg mx-auto mb-10">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                            <Mail className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-bold text-foreground mb-1">1. Enviamos o seu Contrato de Adesão</p>
                            <p className="text-sm text-muted-foreground">
                                Verifique sua caixa de entrada e realize a assinatura digital para que possamos ativar o seu plano.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-bold text-foreground mb-1">2. O seu usuário já foi criado!</p>
                            <p className="text-sm text-muted-foreground">
                                Acesse seu painel exclusivo para acompanhar a aprovação e gerenciar sua desocupação.
                            </p>
                            <div className="mt-3 p-3 bg-muted/50 rounded-lg text-xs font-mono border border-border/50">
                                <p><strong>Usuário:</strong> {userEmail}</p>
                                <p><strong>Senha:</strong> 123456</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2 italic">* Altere a senha depois do primeiro acesso.</p>
                        </div>
                    </div>
                </div>

                <Button
                    size="lg"
                    onClick={() => navigate("/auth")}
                    className="w-full sm:w-auto bg-secondary text-secondary-foreground hover:bg-secondary/90 h-14 px-10 rounded-2xl font-black text-lg uppercase tracking-tight shadow-xl shadow-secondary/20 group transition-all"
                >
                    ACESSAR PLATAFORMA
                    <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Button>
            </motion.div>

            <p className="mt-12 text-muted-foreground text-sm flex items-center gap-2">
                © 2026 Entrega Facilitada - Todos os direitos reservados.
            </p>
        </div>
    );
};

export default SuccessPage;

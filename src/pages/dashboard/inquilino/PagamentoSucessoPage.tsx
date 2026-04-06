import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, PartyPopper } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

const PagamentoSucessoPage = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get("session_id");

    useEffect(() => {
        // Trigger confetti on mount
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    return (
        <DashboardLayout role="inquilino">
            <div className="max-w-2xl mx-auto pt-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <PartyPopper className="w-32 h-32 text-emerald-500" />
                        </div>

                        <CardHeader className="text-center pt-12 pb-6">
                            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
                                <CheckCircle2 className="w-10 h-10 text-white" />
                            </div>
                            <CardTitle className="text-3xl font-heading font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tight">
                                Pagamento Confirmado!
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="text-center space-y-8 pb-12">
                            <div className="space-y-4">
                                <p className="text-lg font-medium text-foreground">
                                    Parabéns! Seu pagamento do plano Entrega Facilitada foi processada com sucesso.
                                </p>

                                {sessionId && (
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                                        Ref: {sessionId.substring(0, 20)}...
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                <Button asChild variant="outline" className="border-emerald-500/30 hover:bg-emerald-500/10">
                                    <Link to="/inquilino/contrato">Ver Meu Contrato</Link>
                                </Button>
                                <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20">
                                    <Link to="/inquilino">
                                        Voltar ao Início <ArrowRight className="w-4 h-4 ml-2" />
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </DashboardLayout>
    );
};

export default PagamentoSucessoPage;

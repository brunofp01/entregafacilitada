import { CheckCircle2, Clock, Calendar, Key, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusTrackerProps {
    currentStatus: string;
    dataPretendida?: string;
}

const steps = [
    { id: 'pendente', label: 'Solicitado', icon: Clock, desc: 'Pedido de entrega enviado.' },
    { id: 'em_analise', label: 'Em Análise', icon: AlertCircle, desc: 'Aguardando revisão da imobiliária.' },
    { id: 'agendada', label: 'Vistoria Agendada', icon: Calendar, desc: 'Vistoria de saída marcada.' },
    { id: 'concluida', label: 'Finalizado', icon: CheckCircle2, desc: 'Entrega do imóvel concluída.' },
];

export const StatusTracker = ({ currentStatus, dataPretendida }: StatusTrackerProps) => {
    // Determine the active index
    let activeIndex = steps.findIndex(s => s.id === currentStatus);
    if (activeIndex === -1 && currentStatus === 'cancelada') activeIndex = -1; // Special case

    return (
        <div className="w-full py-6">
            <div className="relative">
                {/* Connector Line */}
                <div className="absolute top-5 left-0 w-full h-0.5 bg-muted z-0 hidden md:block" />
                <div 
                    className="absolute top-5 left-0 h-0.5 bg-secondary transition-all duration-500 z-0 hidden md:block" 
                    style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
                />

                <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8 md:gap-4">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isCompleted = index < activeIndex || currentStatus === 'concluida';
                        const isActive = index === activeIndex;

                        return (
                            <div key={step.id} className="flex md:flex-col items-start md:items-center text-left md:text-center flex-1 group">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 shrink-0 mb-3",
                                    isCompleted ? "bg-secondary border-secondary text-white shadow-lg shadow-secondary/20" : 
                                    isActive ? "bg-background border-secondary text-secondary animate-pulse shadow-md" : 
                                    "bg-background border-muted text-muted-foreground"
                                )}>
                                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                </div>
                                <div className="ml-4 md:ml-0">
                                    <p className={cn(
                                        "text-sm font-bold transition-colors",
                                        isActive ? "text-secondary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                                    )}>
                                        {step.label}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight md:max-w-[120px] mx-auto">
                                        {isActive && step.id === 'agendada' && dataPretendida ? 
                                            `Agendado para ${new Date(dataPretendida).toLocaleDateString('pt-BR')}` : 
                                            step.desc}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {currentStatus === 'cancelada' && (
                <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-sm font-bold text-red-600">Esta solicitação foi cancelada pela imobiliária.</p>
                </div>
            )}
        </div>
    );
};

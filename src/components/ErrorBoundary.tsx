import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/30">
                    <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center border-t-8 border-secondary">
                        <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-10 h-10 text-secondary" />
                        </div>
                        <h1 className="text-3xl font-heading font-black text-foreground mb-4 uppercase tracking-tighter italic">
                            Oops! Algo deu errado.
                        </h1>
                        <p className="text-muted-foreground mb-8 font-medium">
                            Ocorreu um erro inesperado ao carregar esta página. Não se preocupe, seus dados estão seguros.
                        </p>

                        <div className="space-y-3">
                            <Button
                                onClick={() => window.location.reload()}
                                className="w-full h-12 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Recarregar Página
                            </Button>

                            <Button
                                variant="ghost"
                                onClick={() => window.location.href = '/'}
                                className="w-full h-12 text-muted-foreground font-bold uppercase tracking-widest"
                            >
                                Voltar ao Início
                            </Button>
                        </div>

                        <div className="mt-8 pt-6 border-t border-border/50">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-50">
                                Se o problema persistir, entre em contato com o suporte.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

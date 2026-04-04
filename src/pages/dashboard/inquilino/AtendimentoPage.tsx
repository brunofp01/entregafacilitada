import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Mail, Clock, ChevronDown, ChevronUp, Phone } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const faqs = [
    {
        q: "O que é a Entrega Facilitada?",
        a: "A Entrega Facilitada é um serviço que garante a entrega do imóvel de forma organizada e sem complicações ao final do contrato de locação, protegendo o inquilino de cobranças indevidas e acelerando a vistoria final.",
    },
    {
        q: "Quando posso solicitar a entrega do imóvel?",
        a: "Você pode solicitar a entrega do imóvel assim que seu plano EF estiver ativo e você tiver a intenção de encerrar a locação. O processo de solicitação fica disponível diretamente nesta plataforma.",
    },
    {
        q: "O que acontece após a solicitação de entrega?",
        a: "Nossa equipe entra em contato para agendar a vistoria de saída, que será feita por um vistoriador credenciado. Após a vistoria, emitimos o laudo final e acompanhamos todo o processo junto à imobiliária.",
    },
    {
        q: "Quais documentos vou precisar para a entrega?",
        a: "Você precisará do laudo de entrada (disponível na seção Contrato EF), comprovante de quitação de contas e chaves do imóvel. Nossa equipe orienta tudo via WhatsApp.",
    },
    {
        q: "Como altero meus dados cadastrais?",
        a: "Acesse a seção 'Meu Perfil' no menu lateral para atualizar seu nome, WhatsApp, e-mail e senha a qualquer momento.",
    },
];

const AtendimentoPage = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

    return (
        <DashboardLayout role="inquilino">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div>
                    <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">Atendimento</h1>
                    <p className="text-muted-foreground">Fale com nossa equipe ou tire suas dúvidas pelo FAQ.</p>
                </div>

                {/* Channels */}
                <div className="grid sm:grid-cols-3 gap-4">
                    {/* WhatsApp */}
                    <Card className="border-border/50 bg-gradient-to-br from-[#25D366]/10 to-transparent backdrop-blur-sm">
                        <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#25D366]/15 flex items-center justify-center">
                                <MessageSquare className="w-6 h-6 text-[#25D366]" />
                            </div>
                            <div>
                                <p className="font-bold text-lg">WhatsApp</p>
                                <p className="text-xs text-muted-foreground mt-1">Resposta em até 2h úteis</p>
                            </div>
                            <Button
                                className="w-full bg-[#25D366] text-white hover:bg-[#20bd5a] font-bold"
                                onClick={() => window.open("https://wa.me/5511999999999?text=Olá!%20Sou%20cliente%20da%20Entrega%20Facilitada%20e%20preciso%20de%20ajuda.", "_blank")}
                            >
                                Iniciar Conversa
                            </Button>
                        </CardContent>
                    </Card>

                    {/* E-mail */}
                    <Card className="border-border/50 bg-gradient-to-br from-secondary/5 to-transparent backdrop-blur-sm">
                        <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                                <Mail className="w-6 h-6 text-secondary" />
                            </div>
                            <div>
                                <p className="font-bold text-lg">E-mail</p>
                                <p className="text-xs text-muted-foreground mt-1">Resposta em até 24h úteis</p>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full font-bold border-border/50 hover:text-secondary hover:bg-secondary/5"
                                onClick={() => window.open("mailto:contato@entregafacilitada.com.br?subject=Suporte%20-%20Cliente%20EF", "_blank")}
                            >
                                Enviar E-mail
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Horário */}
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                <Clock className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-bold text-lg">Horário</p>
                                <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                    <p>Seg–Sex: 9h às 18h</p>
                                    <p>Sáb: 9h às 13h</p>
                                    <p>Dom e feriados: fechado</p>
                                </div>
                            </div>
                            <Button variant="ghost" className="w-full font-bold text-muted-foreground" disabled>
                                <Phone className="w-4 h-4 mr-2" />
                                Telefone em breve
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* FAQ */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="border-b border-border/50 pb-4">
                        <CardTitle className="text-base">Perguntas Frequentes</CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y divide-border/50 p-0">
                        {faqs.map((faq, i) => (
                            <div key={i} className="px-6">
                                <button
                                    onClick={() => toggle(i)}
                                    className="w-full flex items-center justify-between py-5 text-left group"
                                >
                                    <span className={cn("font-bold text-sm group-hover:text-secondary transition-colors", openIndex === i && "text-secondary")}>
                                        {faq.q}
                                    </span>
                                    {openIndex === i
                                        ? <ChevronUp className="w-4 h-4 text-secondary shrink-0 ml-4" />
                                        : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-4" />
                                    }
                                </button>
                                {openIndex === i && (
                                    <div className="pb-5 text-sm text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default AtendimentoPage;

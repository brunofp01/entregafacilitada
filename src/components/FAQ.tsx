import { motion } from "framer-motion";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
    {
        question: "E se a imobiliária reprovar o serviço na vistoria?",
        answer: "Essa é a nossa garantia real. Se a imobiliária exigir qualquer retoque na pintura ou nos reparos que realizamos, nossa equipe volta ao imóvel em até 3 dias úteis e faz o ajuste sem nenhum custo adicional para você.",
    },
    {
        question: "O Entrega Facilitada cobre porta quebrada ou vazamentos?",
        answer: "Não. Nosso foco é a restauração estética (pintura completa, furos de quadro, espelhos de tomada e pequenos reparos de uso normal). Danos estruturais, hidráulicos, elétricos ou mau uso severo (como uma porta quebrada) não fazem parte da cobertura e devem ser resolvidos pelo inquilino ou via Seguro Incêndio.",
    },
    {
        question: "O que acontece se eu sair do imóvel antes de completar 12 ou 24 meses?",
        answer: "Sem problemas! Para que possamos liberar a equipe de execução, basta realizar a quitação do saldo restante do seu plano de assinatura. Uma vez quitado, o serviço é agendado normalmente para a sua data de mudança.",
    },
    {
        question: "Quanto tempo antes da mudança devo acionar vocês?",
        answer: "O ideal é nos avisar com pelo menos 30 dias de antecedência. Isso garante que teremos a equipe reservada para o seu prazo de entrega de chaves.",
    },
    {
        question: "Preciso comprar as tintas ou material?",
        answer: "Não se preocupe com nada. O valor da sua assinatura já inclui toda a mão de obra qualificada e o material necessário (tintas de qualidade, massa, lixas, etc) para deixar o imóvel idêntico ao laudo de vistoria inicial.",
    },
];

const FAQ = () => {
    return (
        <section className="py-24 bg-muted/30" id="faq">
            <div className="container max-w-3xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-foreground mb-4">
                        Dúvidas <span className="text-secondary">Frequentes</span>
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Tudo o que você precisa saber para mudar de casa com total tranquilidade.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                >
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {faqs.map((faq, i) => (
                            <AccordionItem key={i} value={`item-${i}`} className="bg-card border border-border/50 rounded-xl px-6 shadow-sm">
                                <AccordionTrigger className="text-left font-heading font-bold text-lg hover:text-secondary hover:no-underline py-6">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground text-base pb-6 leading-relaxed">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </motion.div>
            </div>
        </section>
    );
};

export default FAQ;

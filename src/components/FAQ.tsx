import { motion } from "framer-motion";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
    {
        question: "E se a imobiliária for rigorosa e reprovar a vistoria de saída?",
        answer: "Essa é a nossa maior garantia para você. Se o fiscal da imobiliária exigir qualquer retoque na pintura ou nos pequenos reparos que realizamos, nossos parceiros homologados retornam ao imóvel e resolvem tudo em até 5 dias úteis. Você não paga 1 centavo a mais por isso e nós lidamos com o estresse da aprovação.",
    },
    {
        question: "Não sai mais barato contratar um pintor por conta própria na hora de mudar?",
        answer: "Na ponta do lápis, não. O primeiro grande erro é esquecer a inflação: ao fechar seu plano hoje, você congela o preço atual da mão de obra e dos materiais. Daqui a 12 ou 24 meses, tudo estará mais caro. Além disso, o pintor particular cobra à vista bem no momento em que você já está gastando com frete e caução nova. Sem contar que, se a imobiliária reprovar o serviço, ele raramente volta de graça. Com a Entrega Facilitada, você blinda seu bolso contra o aumento de preços, dilui o custo e transfere todo o risco da aprovação para nós.",
    },
    {
        question: "Eu preciso comprar as tintas ou acompanhar a obra?",
        answer: "Zero preocupação. O seu plano já cobre toda a mão de obra especializada e 100% do material necessário (tintas homologadas no padrão do seu laudo, massa corrida, lixas). Você literalmente nos entrega as chaves temporárias para a execução e foca apenas em curtir a casa nova.",
    },
    {
        question: "A Entrega Facilitada cobre porta quebrada, vazamento ou elétrica?",
        answer: "Para manter suas parcelas acessíveis, nosso escopo é 100% focado na restauração estética exigida em 99% das vistorias (pintura completa, furos de quadros, espelhos de tomada). Danos estruturais, hidráulicos ou quebras severas de mau uso ficam de fora — mas lembre-se: muitos desses imprevistos podem e devem ser cobertos pelo seu Seguro Incêndio obrigatório!",
    },
    {
        question: "E se eu rescindir meu contrato de aluguel e mudar antes do prazo?",
        answer: "Acontece, e o processo é sem burocracia. Basta realizar a quitação do saldo restante do seu plano de forma antecipada para liberar o agendamento do serviço. Uma vez quitado, a obra é agendada normalmente para a sua data de mudança, sem nenhuma \"taxa de cancelamento\" ou multa surpresa da nossa parte.",
    },
    {
        question: "Quando e como eu devo avisar que estou me mudando?",
        answer: "O ideal é nos avisar com cerca de 30 dias de antecedência. Assim, travamos a agenda da execução para a data exata da sua desocupação, garantindo que o imóvel fique pronto rápido para você não ter que pagar dias extras de aluguel para a imobiliária enquanto o imóvel está vazio.",
    },
];

const FAQ = () => {
    return (
        <section className="py-16 bg-muted/30" id="faq">
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

import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface TestimonialCardProps {
    text: string;
    highlightText: string;
    name: string;
    role: string;
    avatar: string;
}

const TestimonialCard = ({ text, highlightText, name, role, avatar }: TestimonialCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] border border-border/50 flex flex-col h-full"
        >
            <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-secondary text-secondary" />
                ))}
            </div>

            <p className="text-muted-foreground leading-relaxed mb-8 flex-grow">
                {text.split(highlightText).map((part, index, array) => (
                    part !== "" ? (
                        <span key={index}>
                            {part}
                            {index < array.length - 1 && <strong className="text-foreground font-extrabold">{highlightText}</strong>}
                        </span>
                    ) : (
                        index < array.length - 1 && <strong key={index} className="text-foreground font-extrabold">{highlightText}</strong>
                    )
                ))}
            </p>

            <div className="flex items-center gap-4 border-t border-border/50 pt-6">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-muted shrink-0 shadow-sm border border-border/20">
                    <img src={avatar} alt={name} className="w-full h-full object-cover" />
                </div>
                <div>
                    <h4 className="font-heading font-bold text-foreground leading-tight">{name}</h4>
                    <p className="text-sm text-muted-foreground">{role}</p>
                </div>
            </div>
        </motion.div>
    );
};

const Testimonials = () => {
    const testimonials = [
        {
            highlightText: "não tirei um centavo do bolso na hora de mudar",
            text: "Eu estava apavorado com a vistoria de entrega. No apartamento anterior, paguei R$ 3.500 à vista só para pintar e tampar os furos. Com a Entrega Facilitada, eu paguei aos poucos durante o contrato e não tirei um centavo do bolso na hora de mudar. Perfeito.",
            name: "Marcelo T.",
            role: "Apartamento 3 quartos",
            avatar: "/testimonials/marcelo.png"
        },
        {
            highlightText: "entregaram o laudo aprovado de primeira",
            text: "A imobiliária que eu alugava era famosa por reprovar tudo na saída. Deixei a chave com o pessoal da Entrega Facilitada e fui cuidar da minha casa nova. Eles entregaram o laudo aprovado de primeira. Recomendo de olhos fechados!",
            name: "Camila R.",
            role: "Casa 4 quartos",
            avatar: "/testimonials/camila.png"
        },
        {
            highlightText: "A única coisa que eu fiz foi empacotar minhas caixas",
            text: "O pior da mudança é ter que voltar no apartamento velho para limpar e lidar com pedreiro. O plano cobriu toda a estética e a limpeza pesada. A única coisa que eu fiz foi empacotar minhas caixas.",
            name: "Fernando S.",
            role: "Studio",
            avatar: "/testimonials/fernando.png"
        }
    ];

    return (
        <section className="py-20 bg-[#F8F9FA] scroll-mt-20">
            <div className="container px-4">
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-heading font-extrabold text-foreground mb-4"
                    >
                        Quem já mudou <br /> <span className="text-secondary">sem dor de cabeça</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground text-lg"
                    >
                        Veja o que dizem os inquilinos que escolheram a tranquilidade na devolução com Entrega Facilitada.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((t, idx) => (
                        <TestimonialCard key={idx} {...t} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ArrowRight, Loader2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const leadSchema = z.object({
    name: z.string().min(3, "Como podemos te chamar? Nome muito curto."),
    whatsapp: z.string().min(14, "Informe um WhatsApp válido com DDD."),
});

type LeadValues = z.infer<typeof leadSchema>;

interface LeadCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    area: number;
    monthlyValue: number;
}

const LeadCaptureModal = ({ isOpen, onClose, area, monthlyValue }: LeadCaptureModalProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<LeadValues>({
        resolver: zodResolver(leadSchema),
        defaultValues: {
            name: "",
            whatsapp: "",
        },
    });

    const whatsappValue = watch("whatsapp");

    // Basic WhatsApp masking logic
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 11) value = value.slice(0, 11);

        if (value.length > 10) {
            value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
        } else if (value.length > 6) {
            value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
        } else if (value.length > 2) {
            value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        } else if (value.length > 0) {
            value = `(${value}`;
        }

        setValue("whatsapp", value);
    };

    const onSubmit = async (data: LeadValues) => {
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from("leads").insert([
                {
                    name: data.name,
                    whatsapp: data.whatsapp,
                    area: area,
                    monthly_value: monthlyValue,
                    source: "simulator_landpage",
                },
            ]);

            if (error) throw error;

            toast.success("Lead salvo com sucesso!");

            // Save data to session storage for pre-filling checkout if needed
            sessionStorage.setItem("pending_lead_name", data.name);
            sessionStorage.setItem("pending_lead_whatsapp", data.whatsapp);
            sessionStorage.setItem("pending_lead_area", area.toString());

            // Redirecionar para página de contratação (v3)
            navigate("/contratar-publico");
        } catch (error: any) {
            console.error("Erro ao salvar lead:", error);
            // Even if database fails (table not created yet), we redirect to checkout to not break the flow
            // but warn in console
            navigate("/contratar-publico");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-none bg-white rounded-3xl">
                <div className="p-8">
                    <div className="flex justify-center mb-6">
                        <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center">
                            <Lock className="w-6 h-6 text-muted-foreground" />
                        </div>
                    </div>

                    <DialogHeader className="text-center p-0 mb-8">
                        <DialogTitle className="text-2xl md:text-3xl font-heading font-black text-foreground mb-2">
                            Excelente escolha! <br />
                            <span className="text-secondary">Vamos travar este valor?</span>
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-base">
                            Para salvar a sua simulação e liberar a próxima etapa, informe os dados abaixo.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-bold text-foreground">Nome Completo</Label>
                            <Input
                                id="name"
                                placeholder="Como podemos te chamar?"
                                className="h-12 rounded-xl border-border focus:ring-secondary/20"
                                {...register("name")}
                            />
                            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="whatsapp" className="text-sm font-bold text-foreground">WhatsApp</Label>
                            <Input
                                id="whatsapp"
                                placeholder="(DDD) 90000-0000"
                                className="h-12 rounded-xl border-border focus:ring-secondary/20"
                                {...register("whatsapp")}
                                onChange={handlePhoneChange}
                                value={whatsappValue}
                            />
                            {errors.whatsapp && <p className="text-xs text-destructive mt-1">{errors.whatsapp.message}</p>}
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-14 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-2xl font-black text-base uppercase tracking-tight shadow-lg shadow-secondary/20 group transition-all mt-4"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    AVANÇAR PARA CONTRATAÇÃO
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>

                        <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest mt-6">
                            🔒 Seus dados estão seguros. Não enviamos spam.
                        </p>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default LeadCaptureModal;

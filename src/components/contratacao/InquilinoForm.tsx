import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User } from "lucide-react";

interface InquilinoFormProps {
    data: {
        nome: string;
        email: string;
        cpf: string;
        rg: string;
        telefone: string;
    };
    onChange: (data: any) => void;
    disabledFields?: string[];
}

export const InquilinoForm = ({ data, onChange, disabledFields = [] }: InquilinoFormProps) => {
    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-border/50 bg-secondary/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                        <CardTitle>Dados do Inquilino</CardTitle>
                        <CardDescription>O locatário/assinante que pagará as mensalidades.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Nome Completo *</Label>
                        <Input
                            required
                            placeholder="Ex: João da Silva"
                            value={data.nome}
                            onChange={e => onChange({ ...data, nome: e.target.value })}
                            disabled={disabledFields.includes('nome')}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>E-mail *</Label>
                        <Input
                            type="email"
                            required
                            placeholder="joao@email.com"
                            value={data.email}
                            onChange={e => onChange({ ...data, email: e.target.value })}
                            disabled={disabledFields.includes('email')}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>CPF *</Label>
                        <Input required placeholder="000.000.000-00" value={data.cpf} onChange={e => onChange({ ...data, cpf: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <Label>RG *</Label>
                        <Input required placeholder="00.000.000-0" value={data.rg} onChange={e => onChange({ ...data, rg: e.target.value })} />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <Label>Celular / WhatsApp *</Label>
                        <Input required placeholder="(00) 00000-0000" value={data.telefone} onChange={e => onChange({ ...data, telefone: e.target.value })} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ShoppingCart, UserPlus, Mail, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const plans = [
    { id: "basico", name: "Plano Básico", price: 128.81, installments: 24 },
    { id: "premium", name: "Plano Premium", price: 249.90, installments: 24 },
    { id: "custom", name: "Personalizado", price: 0, installments: 12 },
];

const VendasPage = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nome: "",
        email: "",
        cpf: "",
        rg: "",
        telefone: "",
        plano_id: "basico",
    });

    const handleCreateSale = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const selectedPlan = plans.find(p => p.id === formData.plano_id);

        try {
            const response = await fetch('/api/create-sale', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    plano_nome: selectedPlan?.name,
                    plano_mensalidade: selectedPlan?.price,
                    plano_parcelas: selectedPlan?.installments,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Venda gerada com sucesso! Cliente criado e e-mail enviado.");
                navigate("/admin");
            } else {
                throw new Error(data.error || "Erro ao gerar venda");
            }
        } catch (error: any) {
            console.error("Erro Venda:", error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout role="admin">
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div>
                    <h1 className="text-3xl font-heading font-extrabold text-foreground mb-1">Gerar Nova Venda</h1>
                    <p className="text-muted-foreground">Cadastre um novo cliente e gere a assinatura automaticamente.</p>
                </div>

                <form onSubmit={handleCreateSale} className="space-y-6">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-secondary" /> Dados do Cliente
                            </CardTitle>
                            <CardDescription>O sistema criará um acesso automático com a senha padrão (123456).</CardDescription>
                        </CardHeader>
                        <CardContent className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="nome">Nome Completo</Label>
                                <Input
                                    id="nome"
                                    placeholder="Ex: João Silva"
                                    required
                                    value={formData.nome}
                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail (Acesso)</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="cliente@email.com"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                                <Input
                                    id="telefone"
                                    placeholder="(00) 00000-0000"
                                    value={formData.telefone}
                                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cpf">CPF</Label>
                                <Input
                                    id="cpf"
                                    placeholder="000.000.000-00"
                                    value={formData.cpf}
                                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rg">RG</Label>
                                <Input
                                    id="rg"
                                    placeholder="MG-00.000.000"
                                    value={formData.rg}
                                    onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-secondary" /> Seleção de Plano
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="plano">Plano</Label>
                                <Select
                                    value={formData.plano_id}
                                    onValueChange={(val) => setFormData({ ...formData, plano_id: val })}
                                >
                                    <SelectTrigger id="plano">
                                        <SelectValue placeholder="Selecione um plano" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {plans.map(p => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.name} {p.price > 0 && `(R$ ${p.price.toFixed(2)}/mês)`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="p-4 bg-secondary/5 rounded-lg border border-secondary/20 flex items-start gap-3">
                                <Mail className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-bold text-secondary">E-mail de Notificação</p>
                                    <p className="text-muted-foreground italic">
                                        "Olá {formData.nome.split(' ')[0] || 'Cliente'}, sua venda foi gerada! Acesse entregafacilitada.vercel.app com seu e-mail e senha 123456."
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-black h-12 text-lg shadow-xl shadow-secondary/20"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                                <ShieldCheck className="w-5 h-5 mr-1" />
                            )}
                            Finalizar Venda e Criar Cliente
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate(-1)}
                            className="h-12 px-8 font-bold border-border/50"
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
};

export default VendasPage;

import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Save, ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const NovaImobiliariaPage = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nome: "",
        email: "",
        password: "",
    });
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Criar usuário no Auth (idealmente via edge function para não deslogar o admin, 
            // mas aqui usaremos a abordagem de signUp que pode exigir re-auth se não configurado como 'definer' no banco)
            // NOTA: Em Supabase, cadastrar outro usuário via client costuma deslogar o atual.
            // Para resolver isso, usaremos o rpc 'create_user_admin' que deve ser criado no banco.

            const { data, error } = await supabase.rpc('create_new_user', {
                user_email: formData.email,
                user_password: formData.password,
                user_full_name: formData.nome,
                user_role: 'imobiliaria'
            });

            if (error) throw error;

            toast.success("Imobiliária cadastrada com sucesso!");
            navigate("/admin/imobiliarias");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Erro ao cadastrar imobiliária");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout role="admin">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <header className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-heading font-extrabold text-foreground mb-1">Nova Imobiliária</h1>
                        <p className="text-muted-foreground">Cadastre uma nova imobiliária parceira no sistema.</p>
                    </div>
                </header>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-secondary" />
                                    Dados de Acesso
                                </CardTitle>
                                <CardDescription>
                                    As credenciais abaixo serão usadas pela imobiliária para acessar a plataforma.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="nome">Nome Fantasia / Razão Social</Label>
                                            <Input
                                                id="nome"
                                                placeholder="Ex: Imobiliária Silva Ltda"
                                                value={formData.nome}
                                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                                required
                                                className="bg-background/50"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="email">E-mail de Acesso</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="contato@imobiliaria.com.br"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                required
                                                className="bg-background/50"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="password">Senha Temporária</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                required
                                                minLength={6}
                                                className="bg-background/50"
                                            />
                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                A imobiliária poderá alterar esta senha no primeiro acesso.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-border/50 flex justify-end gap-3">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => navigate(-1)}
                                            disabled={loading}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2 font-bold px-8 shadow-lg shadow-secondary/20"
                                        >
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            Criar Perfil
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="border-border/50 bg-secondary/5 border-dashed">
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-secondary" />
                                    Privilégios Administrativos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs text-muted-foreground leading-relaxed">
                                Como **Admin Master**, você tem autoridade para instanciar novas entidades no ecossistema Entrega Facilitada.
                                <br /><br />
                                Este perfil terá acesso total ao Dashboard da Imobiliária, permitindo cadastrar sua própria equipe e clientes.
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default NovaImobiliariaPage;

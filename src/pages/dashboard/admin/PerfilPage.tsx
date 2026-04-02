import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Loader2, Save, User as UserIcon, Mail, Lock, ShieldCheck } from "lucide-react";

const AdminPerfilPage = () => {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [userId, setUserId] = useState("");

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            setUserId(user.id);
            setEmail(user.email || "");

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            if (profile) setFullName(profile.full_name || "");
        } catch (error) {
            console.error("Erro ao carregar perfil:", error);
            toast.error("Erro ao carregar dados do perfil.");
        } finally {
            setFetching(false);
        }
    };

    const handleUpdateProfile = async () => {
        setLoading(true);
        try {
            // 1. Atualizar Nome e Email no Banco (Tabela profiles)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    email: email
                })
                .eq('id', userId);

            if (profileError) throw profileError;

            // 2. Atualizar Email se mudou
            const currentUser = await supabase.auth.getUser();
            if (email !== currentUser.data.user?.email) {
                const { error: emailError } = await supabase.auth.updateUser({ email });
                if (emailError) throw emailError;
                toast.success("E-mail atualizado! Verifique sua nova caixa de entrada para confirmar.");
            }

            // 3. Atualizar Senha se preenchida
            if (newPassword) {
                if (newPassword.length < 6) {
                    toast.error("A senha deve ter pelo menos 6 caracteres.");
                    return;
                }
                const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
                if (passwordError) throw passwordError;
                toast.success("Senha atualizada com sucesso!");
                setNewPassword("");
            }

            toast.success("Perfil atualizado com sucesso!");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Erro ao atualizar perfil.");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <DashboardLayout role="admin">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-secondary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="admin">
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <header>
                    <h1 className="text-3xl font-heading font-extrabold flex items-center gap-3">
                        <UserIcon className="text-secondary" /> Meu Perfil Admin
                    </h1>
                    <p className="text-muted-foreground">Gerencie suas credenciais de acesso ao painel master.</p>
                </header>

                <div className="grid gap-6">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-secondary" /> Identidade e Acesso
                            </CardTitle>
                            <CardDescription>Atualize seu nome de exibição e e-mail de login.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome Completo</Label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        className="pl-9 bg-background/50"
                                        placeholder="Seu nome"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail de Login</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="pl-9 bg-background/50"
                                        placeholder="seu@email.com"
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                                    Atenção: Ao trocar o e-mail, você precisará confirmar a mudança no novo endereço.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Lock className="w-5 h-5 text-secondary" /> Segurança
                            </CardTitle>
                            <CardDescription>Altere sua senha de acesso.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Nova Senha</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        className="pl-9 bg-background/50"
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">Deixe em branco para manter a senha atual.</p>
                            </div>

                            <Button
                                className="w-full bg-secondary font-bold gap-2 py-6 text-lg shadow-lg shadow-secondary/20 transition-all hover:scale-[1.01]"
                                onClick={handleUpdateProfile}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                                Salvar Alterações
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminPerfilPage;

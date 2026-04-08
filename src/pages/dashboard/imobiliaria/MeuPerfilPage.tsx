import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Loader2, Save, User, Upload, Key } from "lucide-react";
import { useVistoriaImage } from "@/hooks/useVistoriaImage";

const MeuPerfilPage = () => {
    const { processImage } = useVistoriaImage();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [userRole, setUserRole] = useState<any>(null);
    const [profile, setProfile] = useState({
        full_name: "",
        whatsapp: "",
        avatar_url: "",
        email: ""
    });
    const [passwords, setPasswords] = useState({
        newPassword: "",
        confirmPassword: ""
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            if (data) {
                setProfile({
                    full_name: data.full_name || "",
                    whatsapp: data.whatsapp || "",
                    avatar_url: data.avatar_url || "",
                    email: user.email || ""
                });
                setUserRole(data.role);
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar perfil.");
        } finally {
            setFetching(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const optimizedFile = await processImage(file, false); // false for jpeg/avatar
            const fileName = `avatars/${user.id}-${Date.now()}.jpg`;

            const { error: uploadError } = await supabase.storage
                .from('vistorias')
                .upload(fileName, optimizedFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('vistorias').getPublicUrl(fileName);
            setProfile({ ...profile, avatar_url: publicUrl });
            toast.success("Foto atualizada!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao subir foto.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Não autenticado");

            // Update Auth Email if changed
            if (profile.email !== user.email) {
                const { error: emailError } = await supabase.auth.updateUser({ email: profile.email });
                if (emailError) throw emailError;
                toast.info("E-mail de confirmação enviado para o novo endereço.");
            }

            // Update Profile Table
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: profile.full_name,
                    whatsapp: profile.whatsapp,
                    avatar_url: profile.avatar_url
                })
                .eq('id', user.id);

            if (error) throw error;
            localStorage.setItem('userName', profile.full_name); // Optional: sync local storage
            toast.success("Perfil atualizado com sucesso!");
        } catch (error: any) {
            toast.error(error.message || "Erro ao salvar Perfil.");
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error("As senhas não coincidem.");
            return;
        }
        if (passwords.newPassword.length < 6) {
            toast.error("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: passwords.newPassword });
            if (error) throw error;
            toast.success("Senha alterada com sucesso!");
            setPasswords({ newPassword: "", confirmPassword: "" });
        } catch (error: any) {
            toast.error(error.message || "Erro ao alterar senha.");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <DashboardLayout role={userRole || "imobiliaria"}>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-secondary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role={userRole || "imobiliaria"}>
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <header>
                    <h1 className="text-3xl font-heading font-extrabold flex items-center gap-3">
                        <User className="text-secondary" /> Meu Perfil
                    </h1>
                    <p className="text-muted-foreground">Gerencie suas informações pessoais e segurança da conta.</p>
                </header>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Avatar Card */}
                    <Card className="md:col-span-1 border-border/50 bg-card/50">
                        <CardHeader>
                            <CardTitle className="text-lg text-center">Sua Foto</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center gap-4">
                            <div className="w-32 h-32 rounded-full border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-white/5 relative group">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-12 h-12 text-muted-foreground" />
                                )}
                                <Label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity z-10">
                                    <Upload className="text-white w-6 h-6" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        onChange={handleAvatarUpload}
                                    />
                                </Label>
                            </div>
                            <p className="text-xs text-center text-muted-foreground italic">Clique para alterar a foto</p>
                        </CardContent>
                    </Card>

                    {/* Detailed Info Card */}
                    <Card className="md:col-span-2 border-border/50 bg-card/50">
                        <CardHeader>
                            <CardTitle className="text-lg">Informações Pessoais</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nome Completo</Label>
                                <Input value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} placeholder="Seu nome" />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>E-mail</Label>
                                    <Input value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} type="email" placeholder="seu@email.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label>WhatsApp</Label>
                                    <Input value={profile.whatsapp} onChange={e => setProfile({ ...profile, whatsapp: e.target.value })} placeholder="(00) 00000-0000" />
                                </div>
                            </div>

                            <Button className="w-full bg-secondary font-bold gap-2 py-6 text-lg shadow-lg shadow-secondary/20" onClick={handleSaveProfile} disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : <Save />}
                                Salvar Alterações
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Password Card */}
                    <Card className="md:col-span-3 border-border/50 bg-card/50">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Key className="w-5 h-5 text-secondary" /> Segurança e Senha
                            </CardTitle>
                            <CardDescription>Altere sua senha de acesso à plataforma.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nova Senha</Label>
                                <Input type="password" value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Confirmar Nova Senha</Label>
                                <Input type="password" value={passwords.confirmPassword} onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })} />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" className="w-full border-secondary text-secondary hover:bg-secondary/10 font-bold" onClick={handleChangePassword} disabled={loading}>
                                Atualizar Senha
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MeuPerfilPage;

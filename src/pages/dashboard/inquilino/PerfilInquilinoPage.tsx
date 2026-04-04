import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Upload, Lock, Save, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

interface ProfileData {
    id: string;
    full_name: string;
    email: string;
    whatsapp: string;
    avatar_url: string;
}

const PerfilInquilinoPage = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<ProfileData>({
        id: "",
        full_name: "",
        email: "",
        whatsapp: "",
        avatar_url: ""
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    // Security
    const [passwordForm, setPasswordForm] = useState({
        newPassword: "",
        confirmPassword: ""
    });
    const [savingPassword, setSavingPassword] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
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
                    id: data.id,
                    full_name: data.full_name || "",
                    email: user.email || data.email || "",
                    whatsapp: data.whatsapp || "",
                    avatar_url: data.avatar_url || ""
                });
            }
        } catch (error) {
            console.error("Erro ao carregar perfil:", error);
            toast.error("Não foi possível carregar os dados do seu perfil.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            let updatedAvatarUrl = profile.avatar_url;

            // Se houver nova foto, faz upload
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
                const filePath = `avatars/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('vistorias')
                    .upload(filePath, avatarFile);

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('vistorias')
                    .getPublicUrl(filePath);

                updatedAvatarUrl = publicUrlData.publicUrl;
            }

            const updates = {
                id: profile.id,
                full_name: profile.full_name,
                whatsapp: profile.whatsapp,
                avatar_url: updatedAvatarUrl,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', profile.id);

            if (error) throw error;

            setProfile(prev => ({ ...prev, avatar_url: updatedAvatarUrl }));
            setAvatarFile(null);
            toast.success("Perfil atualizado com sucesso!");

            // Update Auth Email se mudou
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.email !== profile.email) {
                const { error: emailError } = await supabase.auth.updateUser({ email: profile.email });
                if (emailError) {
                    toast.error("Os dados foram salvos mas houve um erro ao atualizar o e-mail de login.");
                } else {
                    toast.success("E-mail atualizado. Verifique sua caixa de entrada para confirmá-lo.", { duration: 5000 });
                }
            }

        } catch (error: any) {
            toast.error(error.message || "Ocorreu um erro ao atualizar o perfil.");
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            const tempUrl = URL.createObjectURL(file);
            setProfile(prev => ({ ...prev, avatar_url: tempUrl }));
        }
    };

    const handleSavePassword = async () => {
        if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
            toast.error("Preencha as senhas.");
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error("As senhas não coincidem.");
            return;
        }

        try {
            setSavingPassword(true);
            const { error } = await supabase.auth.updateUser({
                password: passwordForm.newPassword
            });

            if (error) throw error;

            toast.success("Senha atualizada com sucesso!");
            setPasswordForm({ newPassword: "", confirmPassword: "" });
        } catch (error: any) {
            toast.error(error.message || "Erro ao atualizar a senha.");
        } finally {
            setSavingPassword(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout role="inquilino">
                <div className="flex h-[50vh] items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-secondary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="inquilino">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div>
                    <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">Meu Perfil</h1>
                    <p className="text-muted-foreground leading-relaxed">
                        Gerencie suas informações pessoais e credenciais de acesso seguro.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                            <CardHeader className="border-b border-border/50 bg-secondary/5 pb-4">
                                <CardTitle className="text-lg">Informações Pessoais</CardTitle>
                                <CardDescription>Atualize seu nome e meios de contato.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Nome Completo</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                className="pl-9"
                                                value={profile.full_name}
                                                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                                placeholder="Ex: João Silva"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>WhatsApp</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                className="pl-9"
                                                value={profile.whatsapp}
                                                onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                                                placeholder="(00) 00000-0000"
                                            />
                                        </div>
                                    </div>
                                    <div className="sm:col-span-2 space-y-2">
                                        <Label>E-mail de Acesso</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                className="pl-9"
                                                type="email"
                                                value={profile.email}
                                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                            <Info className="w-3 h-3" /> Ao alterar o e-mail, será necessário confirmar o novo endereço.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-border/50">
                                    <Button
                                        onClick={handleSaveProfile}
                                        disabled={saving}
                                        className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold shadow-lg shadow-secondary/20"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        Salvar Informações
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader className="border-b border-border/50 bg-secondary/5 pb-4">
                                <CardTitle className="text-lg">Segurança da Conta</CardTitle>
                                <CardDescription>Altere sua senha de acesso ao portal.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Nova Senha</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                className="pl-9"
                                                type="password"
                                                placeholder="••••••••"
                                                value={passwordForm.newPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Confirmar Nova Senha</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                className="pl-9"
                                                type="password"
                                                placeholder="••••••••"
                                                value={passwordForm.confirmPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4 border-t border-border/50 mt-4">
                                    <Button
                                        onClick={handleSavePassword}
                                        disabled={savingPassword}
                                        variant="outline"
                                        className="font-bold border-border/50 hover:bg-secondary/5 hover:text-secondary"
                                    >
                                        {savingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                                        Atualizar Senha
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm sticky top-24">
                            <CardHeader className="text-center pb-4">
                                <CardTitle className="text-lg">Sua Foto</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center">
                                <div className="relative group cursor-pointer mb-6">
                                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-xl bg-muted outline outline-1 outline-border/50 mx-auto">
                                        {profile.avatar_url ? (
                                            <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-secondary/10 flex items-center justify-center">
                                                <User className="w-12 h-12 text-secondary/40" />
                                            </div>
                                        )}
                                    </div>
                                    <label htmlFor="avatar-upload" className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <Upload className="w-6 h-6 text-white mb-1" />
                                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Alterar</span>
                                    </label>
                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                    />
                                </div>
                                <div className="text-center">
                                    <h3 className="font-bold text-lg leading-tight">{profile.full_name || "Preencha seu nome"}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{profile.email}</p>
                                </div>
                                <div className="w-full h-px bg-border/50 my-6" />
                                <div className="text-center text-xs text-muted-foreground">
                                    <p>Inquilino Ativo</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PerfilInquilinoPage;

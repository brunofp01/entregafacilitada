import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Upload, Lock, Save, Loader2, Info, CheckCircle2 } from "lucide-react";
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
    const [savingPassword, setSavingPassword] = useState(false);
    const [profile, setProfile] = useState<ProfileData>({ id: "", full_name: "", email: "", whatsapp: "", avatar_url: "" });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
                if (data) {
                    setProfile({
                        id: data.id,
                        full_name: data.full_name || "",
                        email: user.email || data.email || "",
                        whatsapp: data.whatsapp || "",
                        avatar_url: data.avatar_url || "",
                    });
                }
            } catch (error) {
                toast.error("Não foi possível carregar os dados do perfil.");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setProfile(prev => ({ ...prev, avatar_url: URL.createObjectURL(file) }));
        }
    };

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            let avatarUrl = profile.avatar_url;

            if (avatarFile) {
                const fileExt = avatarFile.name.split(".").pop();
                const filePath = `avatars/${profile.id}-${Math.random()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from("vistorias").upload(filePath, avatarFile);
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from("vistorias").getPublicUrl(filePath);
                avatarUrl = urlData.publicUrl;
            }

            const { error } = await supabase.from("profiles").update({
                full_name: profile.full_name,
                whatsapp: profile.whatsapp,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            }).eq("id", profile.id);

            if (error) throw error;
            setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
            setAvatarFile(null);
            toast.success("Perfil atualizado com sucesso!");

            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.email !== profile.email) {
                const { error: emailError } = await supabase.auth.updateUser({ email: profile.email });
                if (emailError) toast.error("Dados salvos, mas erro ao atualizar o e-mail de login.");
                else toast.success("E-mail atualizado. Confirme o novo endereço na sua caixa de entrada.", { duration: 5000 });
            }
        } catch (error: any) {
            toast.error(error.message || "Erro ao atualizar o perfil.");
        } finally {
            setSaving(false);
        }
    };

    const handleSavePassword = async () => {
        if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
            toast.error("Preencha os dois campos de senha."); return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error("As senhas não coincidem."); return;
        }
        if (passwordForm.newPassword.length < 6) {
            toast.error("A senha deve ter pelo menos 6 caracteres."); return;
        }
        try {
            setSavingPassword(true);
            const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
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
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div>
                    <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">Meu Perfil</h1>
                    <p className="text-muted-foreground">Gerencie suas informações pessoais e credenciais de acesso.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-start">

                    {/* Avatar Card */}
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm md:sticky md:top-24">
                        <CardContent className="pt-8 pb-6 flex flex-col items-center text-center">
                            <div className="relative group cursor-pointer mb-5">
                                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-background shadow-xl bg-muted outline outline-1 outline-border/50 mx-auto">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-secondary/10 flex items-center justify-center">
                                            <User className="w-12 h-12 text-secondary/40" />
                                        </div>
                                    )}
                                </div>
                                <label htmlFor="avatar-upload" className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <Upload className="w-5 h-5 text-white mb-1" />
                                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Alterar</span>
                                </label>
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    className="hidden"
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                />
                            </div>
                            <h3 className="font-bold text-lg leading-tight">{profile.full_name || "Cliente EF"}</h3>
                            <p className="text-sm text-muted-foreground mt-1 truncate max-w-full px-2">{profile.email}</p>
                            <div className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-secondary/10 text-secondary border border-secondary/20">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Cliente EF
                            </div>
                        </CardContent>
                    </Card>

                    {/* Forms */}
                    <div className="md:col-span-2 space-y-6">

                        {/* Personal Info */}
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader className="border-b border-border/50 bg-secondary/5 pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <User className="w-5 h-5 text-secondary" /> Informações Pessoais
                                </CardTitle>
                                <CardDescription>Atualize seu nome e meios de contato.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-5">
                                <div className="space-y-2">
                                    <Label>Nome Completo</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-9" value={profile.full_name}
                                            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                            placeholder="Ex: João Silva" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>WhatsApp</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-9" value={profile.whatsapp}
                                            onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                                            placeholder="(00) 00000-0000" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>E-mail de Acesso</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-9" type="email" value={profile.email}
                                            onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                                    </div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Info className="w-3 h-3" /> Ao alterar o e-mail, será necessário confirmar o novo endereço.
                                    </p>
                                </div>
                                <div className="flex justify-end pt-2 border-t border-border/50">
                                    <Button onClick={handleSaveProfile} disabled={saving}
                                        className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold shadow-lg shadow-secondary/20">
                                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        Salvar Informações
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Password */}
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader className="border-b border-border/50 bg-secondary/5 pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Lock className="w-5 h-5 text-secondary" /> Segurança da Conta
                                </CardTitle>
                                <CardDescription>Altere sua senha de acesso ao portal.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-5">
                                <div className="grid sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <Label>Nova Senha</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input className="pl-9" type="password" placeholder="••••••••"
                                                value={passwordForm.newPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Confirmar Nova Senha</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input className="pl-9" type="password" placeholder="••••••••"
                                                value={passwordForm.confirmPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2 border-t border-border/50">
                                    <Button onClick={handleSavePassword} disabled={savingPassword} variant="outline"
                                        className="font-bold border-border/50 hover:bg-secondary/5 hover:text-secondary">
                                        {savingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                                        Atualizar Senha
                                    </Button>
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

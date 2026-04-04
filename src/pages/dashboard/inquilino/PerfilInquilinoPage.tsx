import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    User, Mail, Phone, Upload, Lock, Save, Loader2, Info,
    ShieldCheck, Clock, AlertTriangle, CheckCircle2, FileText,
    FileUp, MessageSquare, Home, CreditCard, BadgeCheck, Calendar
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

interface ProfileData {
    id: string;
    full_name: string;
    email: string;
    whatsapp: string;
    avatar_url: string;
}

interface ContratoEFData {
    id: string;
    nome: string;
    email: string;
    endereco_rua: string;
    endereco_numero: string;
    endereco_complemento: string;
    endereco_bairro: string;
    endereco_cidade: string;
    status_assinatura: string;
    aprovacao_ef: string;
    plano_nome: string;
    plano_mensalidade: number;
    plano_parcelas: number;
    contrato_locacao_url: string;
    vistoria_upload_url: string;
    vistoria_id: string;
    created_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatDate = (iso: string) => {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    } catch {
        return "—";
    }
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const PerfilInquilinoPage = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    const [profile, setProfile] = useState<ProfileData>({
        id: "",
        full_name: "",
        email: "",
        whatsapp: "",
        avatar_url: "",
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [contrato, setContrato] = useState<ContratoEFData | null>(null);

    const [passwordForm, setPasswordForm] = useState({
        newPassword: "",
        confirmPassword: "",
    });

    // -------------------------------------------------------------------------
    // Data fetching
    // -------------------------------------------------------------------------
    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true);
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (!user) return;

                // Profile
                const { data: profileData } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single();

                if (profileData) {
                    setProfile({
                        id: profileData.id,
                        full_name: profileData.full_name || "",
                        email: user.email || profileData.email || "",
                        whatsapp: profileData.whatsapp || "",
                        avatar_url: profileData.avatar_url || "",
                    });
                }

                // Contrato EF (inquilinos table)
                const { data: contratoData } = await supabase
                    .from("inquilinos")
                    .select("*")
                    .eq("email", user.email)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();

                if (contratoData) {
                    setContrato(contratoData as ContratoEFData);
                }
            } catch (err) {
                console.error("Erro ao carregar perfil do cliente:", err);
                toast.error("Não foi possível carregar os dados do perfil.");
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, []);

    // -------------------------------------------------------------------------
    // Status config
    // -------------------------------------------------------------------------
    const getStatusConfig = () => {
        if (!contrato) return null;
        const { status_assinatura, aprovacao_ef } = contrato;
        if (status_assinatura !== "assinado") {
            return {
                bg: "bg-orange-500/10",
                border: "border-orange-500/20",
                text: "text-orange-600",
                Icon: Clock,
                label: "Aguardando Assinatura",
                description: "Verifique seu e-mail e assine o contrato EF digitalmente.",
                spin: false,
            };
        }
        if (aprovacao_ef === "pendente") {
            return {
                bg: "bg-violet-500/10",
                border: "border-violet-500/20",
                text: "text-violet-600",
                Icon: Loader2,
                label: "Em Análise",
                description: "Assinatura recebida! Sua documentação está em revisão pela equipe EF.",
                spin: true,
            };
        }
        if (aprovacao_ef === "aprovado") {
            return {
                bg: "bg-emerald-500/10",
                border: "border-emerald-500/20",
                text: "text-emerald-600",
                Icon: ShieldCheck,
                label: "Plano Ativo",
                description: "Sua cobertura EF está ativa e você está protegido.",
                spin: false,
            };
        }
        if (aprovacao_ef === "recusado") {
            return {
                bg: "bg-destructive/10",
                border: "border-destructive/20",
                text: "text-destructive",
                Icon: AlertTriangle,
                label: "Reprovado",
                description: "Seu contrato foi recusado. Entre em contato com o suporte EF.",
                spin: false,
            };
        }
        return null;
    };

    const statusConfig = getStatusConfig();

    // -------------------------------------------------------------------------
    // Handlers
    // -------------------------------------------------------------------------
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setProfile((prev) => ({ ...prev, avatar_url: URL.createObjectURL(file) }));
        }
    };

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            let updatedAvatarUrl = profile.avatar_url;

            if (avatarFile) {
                const fileExt = avatarFile.name.split(".").pop();
                const filePath = `avatars/${profile.id}-${Math.random()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from("vistorias")
                    .upload(filePath, avatarFile);
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from("vistorias").getPublicUrl(filePath);
                updatedAvatarUrl = urlData.publicUrl;
            }

            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: profile.full_name,
                    whatsapp: profile.whatsapp,
                    avatar_url: updatedAvatarUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", profile.id);

            if (error) throw error;

            setProfile((prev) => ({ ...prev, avatar_url: updatedAvatarUrl }));
            setAvatarFile(null);
            toast.success("Perfil atualizado com sucesso!");

            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (user && user.email !== profile.email) {
                const { error: emailError } = await supabase.auth.updateUser({ email: profile.email });
                if (emailError) {
                    toast.error("Os dados foram salvos, mas houve um erro ao atualizar o e-mail de login.");
                } else {
                    toast.success("E-mail atualizado. Verifique sua caixa de entrada para confirmá-lo.", {
                        duration: 5000,
                    });
                }
            }
        } catch (error: any) {
            toast.error(error.message || "Ocorreu um erro ao salvar o perfil.");
        } finally {
            setSaving(false);
        }
    };

    const handleSavePassword = async () => {
        if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
            toast.error("Preencha os dois campos de senha.");
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error("As senhas não coincidem.");
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            toast.error("A senha deve ter pelo menos 6 caracteres.");
            return;
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

    // -------------------------------------------------------------------------
    // Loading
    // -------------------------------------------------------------------------
    if (loading) {
        return (
            <DashboardLayout role="inquilino">
                <div className="flex h-[50vh] items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-secondary" />
                </div>
            </DashboardLayout>
        );
    }

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------
    return (
        <DashboardLayout role="inquilino">
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Page Header */}
                <div>
                    <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">
                        Meu Perfil
                    </h1>
                    <p className="text-muted-foreground leading-relaxed">
                        Gerencie seus dados pessoais, visualize seu contrato EF e acesse seus documentos.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 items-start">

                    {/* ----------------------------------------------------------------
              LEFT COLUMN — Sticky Identity Card
          ---------------------------------------------------------------- */}
                    <div className="space-y-6 lg:sticky lg:top-24">

                        {/* Identity Card */}
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardContent className="pt-8 pb-6 flex flex-col items-center text-center">
                                {/* Avatar */}
                                <div className="relative group cursor-pointer mb-5">
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-background shadow-xl bg-muted outline outline-1 outline-border/50 mx-auto">
                                        {profile.avatar_url ? (
                                            <img
                                                src={profile.avatar_url}
                                                alt={profile.full_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-secondary/10 flex items-center justify-center">
                                                <User className="w-10 h-10 text-secondary/40" />
                                            </div>
                                        )}
                                    </div>
                                    <label
                                        htmlFor="avatar-upload"
                                        className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    >
                                        <Upload className="w-5 h-5 text-white mb-1" />
                                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                                            Alterar
                                        </span>
                                    </label>
                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                    />
                                </div>

                                <h3 className="font-bold text-lg leading-tight">
                                    {profile.full_name || "Cliente EF"}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">{profile.email}</p>

                                {/* Status Badge */}
                                {statusConfig && (
                                    <div
                                        className={cn(
                                            "mt-4 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border",
                                            statusConfig.bg,
                                            statusConfig.border,
                                            statusConfig.text
                                        )}
                                    >
                                        <statusConfig.Icon
                                            className={cn("w-3.5 h-3.5", statusConfig.spin && "animate-spin")}
                                        />
                                        {statusConfig.label}
                                    </div>
                                )}

                                {!contrato && (
                                    <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border bg-muted/50 border-border/50 text-muted-foreground">
                                        <Info className="w-3.5 h-3.5" />
                                        Sem contrato ativo
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Suporte */}
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm bg-gradient-to-br from-secondary/5 to-transparent">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-secondary" />
                                    Suporte Oficial
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                                    Dúvidas sobre sua cobertura, rescisão ou documentação? Nossa equipe está pronta para ajudar.
                                </p>
                                <Button
                                    className="w-full justify-center gap-2 bg-[#25D366] text-white hover:bg-[#20bd5a] font-bold"
                                    onClick={() =>
                                        window.open(
                                            "https://wa.me/5511999999999?text=Olá!%20Sou%20cliente%20da%20Entrega%20Facilitada%20e%20preciso%20de%20ajuda.",
                                            "_blank"
                                        )
                                    }
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Falar no WhatsApp
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ----------------------------------------------------------------
              RIGHT COLUMN — Main Content
          ---------------------------------------------------------------- */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* ------------------------------------------------------------
                CONTRATO EF
            ------------------------------------------------------------ */}
                        {contrato ? (
                            <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                                <CardHeader className="border-b border-border/50 bg-secondary/5 pb-4">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <BadgeCheck className="w-5 h-5 text-secondary" />
                                        Contrato Entrega Facilitada
                                    </CardTitle>
                                    <CardDescription>
                                        Detalhes do seu plano e cobertura EF.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">

                                    {/* Status Alert */}
                                    {statusConfig && (
                                        <div
                                            className={cn(
                                                "mb-6 p-4 rounded-xl flex items-start gap-3 border",
                                                statusConfig.bg,
                                                statusConfig.border
                                            )}
                                        >
                                            <statusConfig.Icon
                                                className={cn(
                                                    "w-5 h-5 shrink-0 mt-0.5",
                                                    statusConfig.text,
                                                    statusConfig.spin && "animate-spin"
                                                )}
                                            />
                                            <div>
                                                <p className={cn("font-bold text-sm", statusConfig.text)}>
                                                    {statusConfig.label}
                                                </p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {statusConfig.description}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid sm:grid-cols-2 gap-6">
                                        {/* Plano */}
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                                                Plano Contratado
                                            </p>
                                            <p className="font-black text-secondary uppercase bg-secondary/10 inline-block px-3 py-1 rounded-sm border border-secondary/20">
                                                {contrato.plano_nome || "—"}
                                            </p>
                                        </div>

                                        {/* Condição de Pagamento */}
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold flex items-center gap-1">
                                                <CreditCard className="w-3 h-3" /> Condição de Pagamento
                                            </p>
                                            <p className="text-lg font-black">
                                                {contrato.plano_parcelas}x{" "}
                                                <span className="text-muted-foreground font-bold">R$</span>{" "}
                                                {contrato.plano_mensalidade?.toLocaleString("pt-BR", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </p>
                                        </div>

                                        {/* Imóvel */}
                                        <div className="sm:col-span-2 space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold flex items-center gap-1">
                                                <Home className="w-3 h-3" /> Imóvel Protegido
                                            </p>
                                            <p className="font-bold leading-snug">
                                                {contrato.endereco_rua}, {contrato.endereco_numero}
                                                {contrato.endereco_complemento &&
                                                    ` - ${contrato.endereco_complemento}`}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {contrato.endereco_bairro}, {contrato.endereco_cidade}
                                            </p>
                                        </div>

                                        {/* Data de adesão */}
                                        {contrato.created_at && (
                                            <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> Data de Adesão
                                                </p>
                                                <p className="font-bold">{formatDate(contrato.created_at)}</p>
                                            </div>
                                        )}

                                        {/* ID do contrato */}
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                                                Nº do Contrato
                                            </p>
                                            <p className="font-mono font-bold text-muted-foreground">
                                                {contrato.id.split("-")[0].toUpperCase()}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-10 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                                        <FileText className="w-7 h-7 text-muted-foreground" />
                                    </div>
                                    <h3 className="font-bold text-lg">Nenhum contrato EF encontrado</h3>
                                    <p className="text-sm text-muted-foreground max-w-sm">
                                        Não localizamos um contrato ativo associado ao seu e-mail. Se você acabou de assinar, aguarde alguns minutos.
                                    </p>
                                </div>
                            </Card>
                        )}

                        {/* ------------------------------------------------------------
                DOCUMENTOS
            ------------------------------------------------------------ */}
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader className="border-b border-border/50 bg-secondary/5 pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-secondary" />
                                    Meus Documentos
                                </CardTitle>
                                <CardDescription>
                                    Acesse os documentos vinculados ao seu contrato EF.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-5 grid sm:grid-cols-2 gap-3">
                                {contrato?.contrato_locacao_url ? (
                                    <Button
                                        variant="outline"
                                        className="justify-start gap-3 h-14 border-border/50 hover:bg-secondary/5 font-bold hover:text-secondary group"
                                        onClick={() => window.open(contrato.contrato_locacao_url, "_blank")}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20">
                                            <FileUp className="w-4 h-4 text-secondary" />
                                        </div>
                                        Contrato EF Assinado
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-3 h-14 px-4 rounded-lg border border-dashed border-border/50 bg-muted/20">
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                            <FileUp className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <span className="text-sm text-muted-foreground italic">
                                            Contrato EF indisponível
                                        </span>
                                    </div>
                                )}

                                {contrato?.vistoria_upload_url ? (
                                    <Button
                                        variant="outline"
                                        className="justify-start gap-3 h-14 border-border/50 hover:bg-emerald-500/5 font-bold hover:text-emerald-500 group"
                                        onClick={() => window.open(contrato.vistoria_upload_url, "_blank")}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20">
                                            <FileText className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        Laudo de Vistoria
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-3 h-14 px-4 rounded-lg border border-dashed border-border/50 bg-muted/20">
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                            <FileText className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <span className="text-sm text-muted-foreground italic">
                                            Laudo de vistoria indisponível
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* ------------------------------------------------------------
                DADOS PESSOAIS
            ------------------------------------------------------------ */}
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader className="border-b border-border/50 bg-secondary/5 pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <User className="w-5 h-5 text-secondary" />
                                    Informações Pessoais
                                </CardTitle>
                                <CardDescription>
                                    Atualize seu nome e meios de contato.
                                </CardDescription>
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
                                                onChange={(e) =>
                                                    setProfile({ ...profile, full_name: e.target.value })
                                                }
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
                                                onChange={(e) =>
                                                    setProfile({ ...profile, whatsapp: e.target.value })
                                                }
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
                                                onChange={(e) =>
                                                    setProfile({ ...profile, email: e.target.value })
                                                }
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Info className="w-3 h-3" />
                                            Ao alterar o e-mail, será necessário confirmar o novo endereço.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-border/50">
                                    <Button
                                        onClick={handleSaveProfile}
                                        disabled={saving}
                                        className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold shadow-lg shadow-secondary/20"
                                    >
                                        {saving ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4 mr-2" />
                                        )}
                                        Salvar Informações
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* ------------------------------------------------------------
                SEGURANÇA
            ------------------------------------------------------------ */}
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader className="border-b border-border/50 bg-secondary/5 pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Lock className="w-5 h-5 text-secondary" />
                                    Segurança da Conta
                                </CardTitle>
                                <CardDescription>
                                    Altere sua senha de acesso ao portal.
                                </CardDescription>
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
                                                onChange={(e) =>
                                                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Confirmar Nova Senha</Label>
                                        <div className="relative">
                                            <CheckCircle2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                className="pl-9"
                                                type="password"
                                                placeholder="••••••••"
                                                value={passwordForm.confirmPassword}
                                                onChange={(e) =>
                                                    setPasswordForm({
                                                        ...passwordForm,
                                                        confirmPassword: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4 border-t border-border/50 mt-2">
                                    <Button
                                        onClick={handleSavePassword}
                                        disabled={savingPassword}
                                        variant="outline"
                                        className="font-bold border-border/50 hover:bg-secondary/5 hover:text-secondary"
                                    >
                                        {savingPassword ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Lock className="w-4 h-4 mr-2" />
                                        )}
                                        Atualizar Senha
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                    </div>{/* end right column */}
                </div>{/* end grid */}
            </div>
        </DashboardLayout>
    );
};

export default PerfilInquilinoPage;

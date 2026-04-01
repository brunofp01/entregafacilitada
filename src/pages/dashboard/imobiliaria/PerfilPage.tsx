import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Loader2, Save, Building2, Upload } from "lucide-react";
import { useVistoriaImage } from "@/hooks/useVistoriaImage";

const PerfilPage = () => {
  const { processImage } = useVistoriaImage();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [profile, setProfile] = useState({
    nome_fantasia: "",
    cnpj: "",
    endereco_completo: "",
    whatsapp: "",
    email: "",
    logo_url: ""
  });

  useEffect(() => {
    fetchPerfil();
  }, []);

  const fetchPerfil = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('imobiliaria_perfil')
        .select('*')
        .eq('imobiliaria_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) setProfile(data);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar perfil.");
    } finally {
      setFetching(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    toast.info("Otimizando logo (preservando transparência)...");
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 2. Otimizar mantendo PNG
      const optimizedFile = await processImage(file, true);

      const fileName = `logos/${user.id}-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('vistorias')
        .upload(fileName, optimizedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('vistorias').getPublicUrl(fileName);
      setProfile({ ...profile, logo_url: publicUrl });
      toast.success("Logo enviada e otimizada!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao subir logo.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Payload limpo para Upsert - Incluindo o ID original se existir para garantir o Update
      const payload: any = {
        imobiliaria_id: user.id,
        nome_fantasia: profile.nome_fantasia || "",
        cnpj: profile.cnpj || "",
        endereco_completo: profile.endereco_completo || "",
        whatsapp: profile.whatsapp || "",
        email: profile.email || "",
        logo_url: profile.logo_url || ""
      };

      if ((profile as any).id) {
        payload.id = (profile as any).id;
      }

      const { error } = await supabase
        .from('imobiliaria_perfil')
        .upsert(payload, { onConflict: 'imobiliaria_id' });

      if (error) throw error;
      toast.success("Configurações salvas com sucesso!");
    } catch (error: any) {
      console.error(error);
      const msg = error.message || "Erro desconhecido ao salvar perfil.";
      toast.error(`Falha no banco: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <DashboardLayout role="imobiliaria">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="imobiliaria">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header>
          <h1 className="text-3xl font-heading font-extrabold flex items-center gap-3">
            <Building2 className="text-secondary" /> Configurações da Imobiliária
          </h1>
          <p className="text-muted-foreground">Estes dados aparecerão no cabeçalho dos laudos gerados.</p>
        </header>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="md:col-span-1 border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Logo da Imobiliária</CardTitle>
              <CardDescription>Recomendado: PNG transparente</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="w-full aspect-square border-2 border-dashed border-border rounded-2xl flex items-center justify-center overflow-hidden bg-white/5 relative group">
                {profile.logo_url ? (
                  <img src={profile.logo_url} className="max-w-full max-h-full object-contain p-4" />
                ) : (
                  <Building2 className="w-12 h-12 text-muted-foreground" />
                )}
                <Label htmlFor="logo-upload" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                  <Upload className="text-white w-6 h-6" />
                </Label>
                <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </div>
              <p className="text-xs text-center text-muted-foreground italic">Clique para alterar a logo</p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Dados Institucionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome Fantasia</Label>
                <Input value={profile.nome_fantasia} onChange={e => setProfile({...profile, nome_fantasia: e.target.value})} placeholder="Nome da Imobiliária" />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input value={profile.cnpj} onChange={e => setProfile({...profile, cnpj: e.target.value})} placeholder="00.000.000/0000-00" />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp (Comercial)</Label>
                  <Input value={profile.whatsapp} onChange={e => setProfile({...profile, whatsapp: e.target.value})} placeholder="(00) 00000-0000" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>E-mail Suporte</Label>
                <Input value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} type="email" placeholder="contato@imobiliaria.com" />
              </div>

              <div className="space-y-2">
                <Label>Endereço Completo</Label>
                <Input value={profile.endereco_completo} onChange={e => setProfile({...profile, endereco_completo: e.target.value})} placeholder="Av. Principal, 123 - Centro" />
              </div>

              <Button className="w-full bg-secondary font-bold gap-2 py-6 text-lg shadow-lg shadow-secondary/20" onClick={handleSave} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <Save />}
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PerfilPage;

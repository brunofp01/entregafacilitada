import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, UserPlus, Mail, ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

import { createClient } from '@supabase/supabase-js';

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
  whatsapp?: string | null;
  role: string;
}

const EquipePage = () => {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberWhatsapp, setNewMemberWhatsapp] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  const fetchTeam = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current user's full profile
      const { data: me, error: meError } = await supabase
        .from("profiles")
        .select("id, imobiliaria_id, role")
        .eq("id", user.id)
        .single();

      if (meError) {
        console.error("[EquipePage] Error fetching own profile:", meError);
        return;
      }

      console.log("[EquipePage] My profile:", me);

      // For the owner (imobiliaria role), their own id IS the org id
      // For an integrante, imobiliaria_id points to the owner
      const myOrgId = me?.role === 'imobiliaria' ? me?.id : (me?.imobiliaria_id || me?.id);

      console.log("[EquipePage] Searching for org members with imobiliaria_id =", myOrgId);

      const { data: team, error: teamError } = await supabase
        .rpc('get_team_members', { org_id: myOrgId });

      console.log("[EquipePage] Team RPC result:", team, "Error:", teamError);

      if (team) setMembers(team);
    } catch (error) {
      console.error("[EquipePage] Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName || !newMemberEmail || !newMemberWhatsapp) {
      toast.error("Preencha todos os campos do formulário.");
      return;
    }

    setIsInviting(true);
    toast.loading("Criando acesso ao colaborador...");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: profile } = await supabase.from('profiles').select('imobiliaria_id').eq('id', user.id).single();
      const imobiliariaId = profile?.imobiliaria_id || user.id;

      // Secondary client to avoid hijacking current session
      const supabaseAdmin = createClient(
        import.meta.env.VITE_SUPABASE_URL || '',
        import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        { auth: { persistSession: false, autoRefreshToken: false } }
      );

      const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.signUp({
        email: newMemberEmail,
        password: '123456',
        options: {
          data: {
            full_name: newMemberName,
            whatsapp: newMemberWhatsapp,
            role: 'imobiliaria',
            imobiliaria_id: imobiliariaId
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) throw new Error('E-mail já está em uso.');
        throw signUpError;
      }

      // Explicitly update profile utilizing the ephemeral session if available to bypass RLS restrictions
      if (signUpData.user) {
        let updateClient = supabaseAdmin;

        // If email confirmation is disabled, signUpData will have a session.
        // We use this session to authenticate the update request as the new user!
        if (signUpData.session) {
          updateClient = createClient(
            import.meta.env.VITE_SUPABASE_URL || '',
            import.meta.env.VITE_SUPABASE_ANON_KEY || '',
            {
              global: {
                headers: {
                  Authorization: `Bearer ${signUpData.session.access_token}`
                }
              }
            }
          );
        }

        const { error: profileUpdateError } = await updateClient.from('profiles').update({
          full_name: newMemberName,
          whatsapp: newMemberWhatsapp,
          role: 'imobiliaria',
          imobiliaria_id: imobiliariaId
        }).eq('id', signUpData.user.id);

        if (profileUpdateError) {
          console.warn("Failed to update profile directly via new session:", profileUpdateError);
          // Fallback: Try with the agency owner's session just in case RLS allows it
          await supabase.from('profiles').update({
            full_name: newMemberName,
            whatsapp: newMemberWhatsapp,
            role: 'imobiliaria',
            imobiliaria_id: imobiliariaId
          }).eq('id', signUpData.user.id);
        }
      }

      toast.dismiss();
      toast.success("Funcionário adicionado com sucesso! Senha padrão: 123456");

      setNewMemberEmail("");
      setNewMemberName("");
      setNewMemberWhatsapp("");
      fetchTeam();

    } catch (error: any) {
      console.error(error);
      toast.dismiss();
      toast.error(error.message || "Erro ao adicionar funcionário. Tente novamente.");
    } finally {
      setIsInviting(false);
    }
  };

  if (loading) {
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
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">Minha Equipe</h1>
            <p className="text-muted-foreground">Gerencie os funcionários da sua imobiliária e seus acessos.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-lg border border-secondary/20">
            <ShieldCheck className="w-4 h-4 text-secondary" />
            <span className="text-xs font-bold text-secondary uppercase tracking-widest">Organização Ativa</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form to Add Member */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Adicionar Membro</CardTitle>
              <CardDescription>Convide um novo funcionário para a sua organização.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    placeholder="Nome do integrante"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="bg-background/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail Corporativo</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@imobiliaria.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="bg-background/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    placeholder="(00) 00000-0000"
                    value={newMemberWhatsapp}
                    onChange={(e) => setNewMemberWhatsapp(e.target.value)}
                    className="bg-background/50 border-border/50"
                  />
                </div>
                <Button disabled={isInviting} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold gap-2">
                  {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Cadastrar Colaborador
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Members List */}
          <Card className="lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Integrantes da Organização</CardTitle>
                <CardDescription>Pessoas que têm acesso aos seus dados.</CardDescription>
              </div>
              <Users className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.length > 0 ? (
                  members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold border border-secondary/20">
                          {member.full_name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="font-bold">{member.full_name || member.email}</p>
                          <div className="flex items-center gap-4 mt-0.5">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              {member.email}
                            </div>
                            {member.whatsapp && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span className="font-bold">📱</span>
                                {member.whatsapp}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1 bg-muted rounded-md italic">
                        {member.role}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-muted-foreground italic border-2 border-dashed border-border/50 rounded-xl">
                    Nenhum funcionário cadastrado ainda.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EquipePage;

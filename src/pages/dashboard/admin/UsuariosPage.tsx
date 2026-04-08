import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    Search,
    Filter,
    MoreHorizontal,
    Mail,
    Shield,
    UserCircle,
    Key,
    Ban,
    Loader2,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Trash2
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

interface UserProfile {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string;
    updated_at: string;
    created_at: string;
}

const ROLE_ORDER: Record<string, number> = {
    admin_master: 0,
    admin: 1,
    equipe_ef: 2,
    imobiliaria: 3,
    integrante_imobiliaria: 4,
    inquilino: 5
};

const UsuariosPage = () => {
    const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    const handleDeletar = async (id: string, name: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (id === user?.id) {
            toast.error("Você não pode excluir seu próprio usuário admin!");
            return;
        }

        if (!confirm(`Tem certeza que deseja excluir permanentemente o usuário "${name}"? Esta ação é irreversível e removerá o acesso ao sistema (Auth + Banco).`)) {
            return;
        }

        try {
            const { error } = await supabase.rpc('delete_user_by_id', { user_id: id });
            if (error) throw error;
            toast.success("Usuário removido com sucesso!");
            fetchUsuarios();
        } catch (error: any) {
            toast.error("Erro ao remover usuário.");
        }
    };
    const fetchUsuarios = async () => {
        try {
            setLoading(true);
            let query = supabase.from("profiles").select("*");

            if (roleFilter !== "all") {
                query = query.eq("role", roleFilter);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Ordenação manual: Role (definida pelo ROLE_ORDER) e depois created_at
            const sortedData = (data || []).sort((a, b) => {
                const orderA = ROLE_ORDER[a.role] ?? 99;
                const orderB = ROLE_ORDER[b.role] ?? 99;

                if (orderA !== orderB) {
                    return orderA - orderB;
                }

                // Ordenação secundária: criado mais recentemente primeiro
                return new Date(b.created_at || b.updated_at || 0).getTime() -
                    new Date(a.created_at || a.updated_at || 0).getTime();
            });

            setUsuarios(sortedData);
        } catch (error: any) {
            toast.error("Erro ao carregar usuários");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsuarios();
    }, [roleFilter]);

    const filtered = usuarios.filter(u =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "admin_master":
                return <Badge className="bg-amber-500 text-white gap-1 hover:bg-amber-600 shadow-sm border-none"><Shield className="w-3 h-3" /> Master</Badge>;
            case "admin":
                return <Badge className="bg-secondary text-secondary-foreground gap-1"><Shield className="w-3 h-3" /> Admin</Badge>;
            case "equipe_ef":
                return <Badge className="bg-blue-600 text-white gap-1 hover:bg-blue-700 border-none">Equipe EF</Badge>;
            case "imobiliaria":
                return <Badge variant="outline" className="border-secondary text-secondary gap-1 transition-colors hover:bg-secondary/10"><CheckCircle2 className="w-3 h-3" /> Imobiliária</Badge>;
            case "integrante_imobiliaria":
                return <Badge variant="secondary" className="gap-1 opacity-80 transition-opacity hover:opacity-100">Equipe Imob.</Badge>;
            case "inquilino":
                return <Badge variant="outline" className="gap-1 shadow-sm transition-shadow hover:shadow-md italic">Inquilino</Badge>;
            default:
                return <Badge variant="secondary">{role}</Badge>;
        }
    };

    return (
        <DashboardLayout role="admin">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">Controle de Usuários</h1>
                        <p className="text-muted-foreground">Gestão centralizada de todos os perfis e acessos do sistema.</p>
                    </div>
                    <Button variant="outline" onClick={fetchUsuarios} disabled={loading} className="gap-2 border-border/50 bg-background/50 backdrop-blur-sm shadow-sm transition-all hover:bg-secondary/5">
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Sincronizar Base
                    </Button>
                </header>

                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome, e-mail ou UUID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-background/50 border-border/50 transition-all focus:ring-secondary/20 shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex-1 md:w-48">
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="bg-background/50 border-border/50">
                                    <SelectValue placeholder="Filtrar por Perfil" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Perfis</SelectItem>
                                    <SelectItem value="admin_master">Admin Master</SelectItem>
                                    <SelectItem value="admin">Administradores</SelectItem>
                                    <SelectItem value="equipe_ef">Equipe EF</SelectItem>
                                    <SelectItem value="imobiliaria">Imobiliárias</SelectItem>
                                    <SelectItem value="integrante_imobiliaria">Equipe Imobiliária</SelectItem>
                                    <SelectItem value="inquilino">Inquilinos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0 border border-border/50 bg-background/50">
                            <Filter className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                                <Loader2 className="w-8 h-8 animate-spin mb-4 text-secondary" />
                                <p>Mapeando usuários e permissões...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-24 px-4">
                                <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                <h3 className="text-xl font-bold mb-2">Nenhum registro encontrado</h3>
                                <p className="text-muted-foreground mb-6">Tente ajustar seus filtros ou termos de busca.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-[10px] md:text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border/50">
                                        <tr>
                                            <th className="px-3 md:px-6 py-4 font-bold">Identidade</th>
                                            <th className="px-3 md:px-6 py-4 font-bold">Acesso</th>
                                            <th className="px-6 py-4 font-bold hidden md:table-cell italic">Última Atividade</th>
                                            <th className="px-3 md:px-6 py-4 font-bold text-right">Controle</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {filtered.map((user) => (
                                            <tr key={user.id} className="hover:bg-muted/10 transition-colors group">
                                                <td className="px-3 md:px-6 py-4">
                                                    <div className="flex items-center gap-2 md:gap-3">
                                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold border border-secondary/20 shadow-inner shrink-0 transition-transform group-hover:scale-110">
                                                            {user.full_name?.charAt(0).toUpperCase() || "U"}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-foreground truncate text-xs md:text-sm">{user.full_name || "Sem nome"}</div>
                                                            <div className="text-muted-foreground text-[10px] md:text-xs truncate flex items-center gap-1">
                                                                <Mail className="w-2.5 h-2.5 md:w-3 md:h-3" /> {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 md:px-6 py-4">
                                                    {getRoleBadge(user.role)}
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell text-muted-foreground text-xs italic">
                                                    {user.created_at || user.updated_at ? new Date(user.created_at || user.updated_at).toLocaleString('pt-BR') : "Sem data"}
                                                </td>
                                                <td className="px-3 md:px-6 py-4 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary/10 hover:text-secondary rounded-full transition-colors">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-[200px]">
                                                            <DropdownMenuLabel>Gestão do Usuário</DropdownMenuLabel>
                                                            <DropdownMenuItem className="gap-2 focus:bg-secondary/10 focus:text-secondary cursor-pointer">
                                                                <UserCircle className="w-4 h-4" /> Ver Perfil Completo
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="gap-2 focus:bg-secondary/10 focus:text-secondary cursor-pointer">
                                                                <Key className="w-4 h-4" /> Resetar Senha
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive gap-2 focus:bg-destructive/10 focus:text-destructive cursor-pointer font-bold"
                                                                onClick={() => handleDeletar(user.id, user.full_name || "")}
                                                            >
                                                                <Trash2 className="w-4 h-4" /> Excluir Usuário Permanentemente
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default UsuariosPage;

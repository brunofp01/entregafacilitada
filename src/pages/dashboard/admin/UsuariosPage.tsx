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
    AlertCircle
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
}

const UsuariosPage = () => {
    const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    const fetchUsuarios = async () => {
        try {
            setLoading(true);
            let query = supabase.from("profiles").select("*");

            if (roleFilter !== "all") {
                query = query.eq("role", roleFilter);
            }

            const { data, error } = await query.order("updated_at", { ascending: false });

            if (error) throw error;
            setUsuarios(data || []);
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
            case "admin":
                return <Badge className="bg-secondary text-secondary-foreground gap-1"><Shield className="w-3 h-3" /> Master</Badge>;
            case "imobiliaria":
                return <Badge variant="outline" className="border-secondary text-secondary gap-1 transition-colors hover:bg-secondary/10"><CheckCircle2 className="w-3 h-3" /> Imobiliária</Badge>;
            case "integrante_imobiliaria":
                return <Badge variant="secondary" className="gap-1 opacity-80 transition-opacity hover:opacity-100">Equipe</Badge>;
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
                                    <SelectItem value="admin">Administradores</SelectItem>
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
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border/50">
                                        <tr>
                                            <th className="px-6 py-4 font-bold">Identidade</th>
                                            <th className="px-6 py-4 font-bold">Nível de Acesso</th>
                                            <th className="px-6 py-4 font-bold hidden md:table-cell italic">Última Atividade</th>
                                            <th className="px-6 py-4 font-bold text-right">Controle</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {filtered.map((user) => (
                                            <tr key={user.id} className="hover:bg-muted/10 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold border border-secondary/20 shadow-inner shrink-0 transition-transform group-hover:scale-110">
                                                            {user.full_name?.charAt(0).toUpperCase() || "U"}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-foreground truncate">{user.full_name || "Sem nome"}</div>
                                                            <div className="text-muted-foreground text-xs truncate flex items-center gap-1">
                                                                <Mail className="w-3 h-3" /> {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getRoleBadge(user.role)}
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell text-muted-foreground text-xs italic">
                                                    {new Date(user.updated_at).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
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
                                                            <DropdownMenuItem className="text-destructive gap-2 focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                                                                <Ban className="w-4 h-4" /> Bloquear Login
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

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Building2,
    Search,
    Filter,
    MoreHorizontal,
    Mail,
    Calendar,
    MapPin,
    ExternalLink,
    ShieldCheck,
    Loader2,
    RefreshCw,
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

interface ImobiliariaProfile {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string;
    updated_at: string;
    avatar_url?: string;
    // Simular campos extras que poderiam vir de uma tabela 'imobiliarias_detalhes'
}

const ImobiliariasPage = () => {
    const [imobiliarias, setImobiliarias] = useState<ImobiliariaProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const handleDeletar = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja excluir permanentemente a imobiliária "${name}"? Esta ação removerá o acesso ao Authentication e todos os dados vinculados.`)) {
            return;
        }

        try {
            const { error } = await supabase.rpc('delete_user_by_id', { user_id: id });
            if (error) throw error;
            toast.success("Imobiliária removida com sucesso!");
            fetchImobiliarias();
        } catch (error: any) {
            toast.error("Erro ao remover imobiliária.");
        }
    };
    const fetchImobiliarias = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("role", "imobiliaria")
                .order("updated_at", { ascending: false });

            if (error) throw error;
            setImobiliarias(data || []);
        } catch (error: any) {
            toast.error("Erro ao carregar imobiliárias");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchImobiliarias();
    }, []);

    const filtered = imobiliarias.filter(i =>
        i.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        i.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout role="admin">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">Imobiliárias Parceiras</h1>
                        <p className="text-muted-foreground">Gerencie as imobiliárias cadastradas no ecossistema Entrega Facilitada.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={fetchImobiliarias} disabled={loading} className="gap-2">
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                            Atualizar
                        </Button>
                        {localStorage.getItem('userRole') === 'admin_master' && (
                            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg shadow-secondary/20" asChild>
                                <Link to="/admin/imobiliarias/nova">
                                    Cadastrar Imobiliária
                                </Link>
                            </Button>
                        )}
                    </div>
                </header>

                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome ou e-mail..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-background/50 border-border/50"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Button variant="ghost" className="gap-2 text-muted-foreground w-full md:w-auto">
                            <Filter className="w-4 h-4" />
                            Filtros
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin mb-4 text-secondary" />
                        <p>Buscando parceiros...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <Card className="border-dashed border-2 py-20 text-center">
                        <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-lg font-bold">Nenhuma imobiliária encontrada</h3>
                        <p className="text-muted-foreground max-w-xs mx-auto italic">
                            {search ? "Tente ajustar seus termos de busca." : "Ainda não há imobiliárias cadastradas no sistema."}
                        </p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((imob) => (
                            <Card key={imob.id} className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-secondary/30 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-secondary origin-bottom transition-transform scale-y-0 group-hover:scale-y-100" />

                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary font-bold text-xl border border-secondary/20 shadow-inner group-hover:scale-110 transition-transform">
                                            {imob.full_name?.charAt(0).toUpperCase() || "I"}
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 md:h-8 md:w-8 rounded-full bg-muted/20 md:bg-transparent">
                                                    <MoreHorizontal className="w-5 h-5 md:w-4 md:h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                <DropdownMenuItem className="gap-2">
                                                    <ExternalLink className="w-4 h-4" /> Ver Perfil Público
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="gap-2">
                                                    <Mail className="w-4 h-4" /> Enviar Mensagem
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive gap-2 focus:bg-destructive/10 focus:text-destructive cursor-pointer font-bold"
                                                    onClick={() => handleDeletar(imob.id, imob.full_name || "")}
                                                >
                                                    <Trash2 className="w-4 h-4" /> Excluir Imobiliária
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="space-y-1 pt-2">
                                        <CardTitle className="text-lg font-bold truncate group-hover:text-secondary transition-colors">
                                            {imob.full_name || "Imobiliária sem nome"}
                                        </CardTitle>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                            Parceiro Verificado
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-foreground/80">
                                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span className="truncate">{imob.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-foreground/80">
                                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span>Cadastrada em {new Date(imob.updated_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex items-center justify-between border-t border-border/50">
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Inquilinos</p>
                                            <p className="font-bold">--</p>
                                        </div>
                                        <Button variant="ghost" size="sm" className="bg-secondary/5 text-secondary hover:bg-secondary/20">
                                            Ver Portfólio
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ImobiliariasPage;

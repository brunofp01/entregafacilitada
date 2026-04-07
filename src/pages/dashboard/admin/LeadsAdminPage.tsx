import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    Search,
    RefreshCw,
    MessageCircle,
    Calendar,
    ArrowRight,
    Loader2,
    Database,
    Phone
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Lead {
    id: string;
    created_at: string;
    name: string;
    whatsapp: string;
    area: number;
    monthly_value: number;
    source: string;
}

const LeadsAdminPage = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("leads")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                // If table doesn't exist yet, we show a helpful empty state record or message
                if (error.code === '42P01') {
                    console.warn("Table 'leads' not found. Create it in Supabase.");
                } else {
                    throw error;
                }
            }
            setLeads(data || []);
        } catch (error: any) {
            console.error(error);
            toast.error("Erro ao carregar leads.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const filteredLeads = leads.filter(l =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.whatsapp.includes(search)
    );

    const openWhatsApp = (phone: string) => {
        const cleanPhone = phone.replace(/\D/g, "");
        window.open(`https://wa.me/55${cleanPhone}`, "_blank");
    };

    return (
        <DashboardLayout role="admin">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">Leads do Simulador</h1>
                        <p className="text-muted-foreground">Potenciais clientes que realizaram simulações na Landing Page.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={fetchLeads} disabled={loading} className="gap-2">
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                            Atualizar
                        </Button>
                    </div>
                </header>

                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border/50">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome ou WhatsApp..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-background/50 border-border/50"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge variant="outline" className="h-8 gap-1.5 px-3">
                            <Users className="w-3.5 h-3.5" />
                            {leads.length} Total
                        </Badge>
                    </div>
                </div>

                <Card className="border-border/50">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <Loader2 className="w-8 h-8 animate-spin mb-4 text-secondary" />
                                <p>Carregando leads...</p>
                            </div>
                        ) : filteredLeads.length === 0 ? (
                            <div className="py-20 text-center">
                                <Database className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                <h3 className="text-lg font-bold">Nenhum lead encontrado</h3>
                                <p className="text-muted-foreground max-w-xs mx-auto italic">
                                    {search ? "Tente ajustar seus termos de busca." : "Ainda não houve capturas no simulador."}
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead>Data</TableHead>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>WhatsApp</TableHead>
                                        <TableHead>Imóvel (m²)</TableHead>
                                        <TableHead>Valor Simulador</TableHead>
                                        <TableHead className="text-right">Ação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLeads.map((lead) => (
                                        <TableRow key={lead.id} className="hover:bg-muted/10 transition-colors">
                                            <TableCell className="text-xs text-muted-foreground font-medium">
                                                {new Date(lead.created_at).toLocaleDateString()} <br />
                                                <span className="opacity-60">{new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </TableCell>
                                            <TableCell className="font-bold text-foreground">{lead.name}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span className="font-mono text-sm">{lead.whatsapp}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-black">{lead.area} m²</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-bold text-secondary">
                                                    R$ {lead.monthly_value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mês
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                                                    onClick={() => openWhatsApp(lead.whatsapp)}
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                    WhatsApp
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default LeadsAdminPage;

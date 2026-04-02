import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, RefreshCw, Info, Calculator, Settings2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Parameter {
    id: string;
    key: string;
    value: number;
    label: string;
    description: string;
    category: string;
    updated_at: string;
}

const PricingParametersPage = () => {
    const [parameters, setParameters] = useState<Parameter[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingParam, setEditingParam] = useState<Parameter | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newValue, setNewValue] = useState("");

    const fetchParameters = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("pricing_parameters")
                .select("*")
                .order("category", { ascending: true })
                .order("label", { ascending: true });

            if (error) throw error;
            setParameters(data || []);
        } catch (error: any) {
            console.error("Erro ao carregar parâmetros:", error);
            toast.error("Erro ao carregar parâmetros. Certifique-se de que a tabela existe.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParameters();
    }, []);

    const handleEdit = (param: Parameter) => {
        setEditingParam(param);
        setNewValue(param.value.toString());
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!editingParam) return;

        try {
            const val = parseFloat(newValue);
            if (isNaN(val)) {
                toast.error("Por favor, insira um valor numérico válido.");
                return;
            }

            const { error } = await supabase
                .from("pricing_parameters")
                .update({
                    value: val,
                    updated_at: new Date().toISOString()
                })
                .eq("id", editingParam.id);

            if (error) throw error;

            toast.success(`Parâmetro ${editingParam.label} atualizado!`);
            setIsDialogOpen(false);
            fetchParameters();
        } catch (error: any) {
            toast.error("Erro ao salvar: " + error.message);
        }
    };

    const categoriesOrder = ["calculo", "padrao", "geral"];
    const categorized = parameters.reduce((acc, curr) => {
        if (!acc[curr.category]) acc[curr.category] = [];
        acc[curr.category].push(curr);
        return acc;
    }, {} as Record<string, Parameter[]>);

    const getCategoryLabel = (cat: string) => {
        switch (cat) {
            case "calculo": return "Fatores de Cálculo";
            case "padrao": return "Custos por Padrão de Acabamento";
            case "geral": return "Configurações Gerais";
            default: return cat;
        }
    };

    return (
        <DashboardLayout role="admin">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">Parâmetros de Cálculo</h1>
                        <p className="text-muted-foreground">Gerencie as variáveis que alimentam a precificação da plataforma.</p>
                    </div>
                    <Button variant="outline" onClick={fetchParameters} disabled={loading} className="gap-2 border-border/50 bg-background/50 backdrop-blur-sm shadow-sm transition-all hover:bg-secondary/5">
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Sincronizar
                    </Button>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin mb-4 text-secondary" />
                        <p>Carregando algoritmos de precificação...</p>
                    </div>
                ) : parameters.length === 0 ? (
                    <Card className="border-dashed border-2 py-20 text-center">
                        <Settings2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-lg font-bold">Nenhum parâmetro encontrado</h3>
                        <p className="text-muted-foreground max-w-xs mx-auto mb-6 italic">
                            A tabela `pricing_parameters` parece estar vazia ou não foi criada no Supabase.
                        </p>
                    </Card>
                ) : (
                    <div className="grid gap-8">
                        {categoriesOrder.map(cat => categorized[cat] && (
                            <Card key={cat} className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-xl shadow-black/5">
                                <CardHeader className="bg-secondary/5 border-b border-border/50 pb-4">
                                    <div className="flex items-center gap-2">
                                        <Calculator className="w-5 h-5 text-secondary" />
                                        <CardTitle className="text-lg">{getCategoryLabel(cat)}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow>
                                                <TableHead className="w-[300px]">Parâmetro</TableHead>
                                                <TableHead>Valor Atual</TableHead>
                                                <TableHead className="hidden md:table-cell">Regra de Negócio</TableHead>
                                                <TableHead className="text-right">Ação</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {categorized[cat].map(param => (
                                                <TableRow key={param.id} className="hover:bg-muted/10 transition-colors">
                                                    <TableCell className="py-4">
                                                        <div className="font-bold">{param.label}</div>
                                                        <div className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider">{param.key}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="font-mono text-sm bg-secondary/10 text-secondary border-secondary/20">
                                                            {param.value < 1 ? (param.value * 100).toFixed(1) + "%" : "R$ " + param.value}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-[300px]">
                                                        {param.description}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(param)} className="text-secondary hover:bg-secondary/10 hover:text-secondary">
                                                            Ajustar
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Settings2 className="w-5 h-5 text-secondary" />
                                Ajustar Parâmetro
                            </DialogTitle>
                            <DialogDescription>
                                Alterar o valor de <strong className="text-foreground">{editingParam?.label}</strong> afetará imediatamente todos os novos cálculos na plataforma.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="value">Novo Valor</Label>
                                <Input
                                    id="value"
                                    type="number"
                                    step="0.01"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    className="bg-background/50"
                                />
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Info className="w-3 h-3" /> Use ponto (.) para decimais. Ex: 0.15 para 15%
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSave} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
                                <Save className="w-4 h-4" /> Salvar Alteração
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default PricingParametersPage;

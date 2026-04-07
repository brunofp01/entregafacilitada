import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Save,
    Plus,
    Trash2,
    GripVertical,
    Info,
    FileText,
    Eye,
    Code,
    ChevronUp,
    ChevronDown,
    Loader2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ContractSection {
    id: string;
    title: string;
    content: string;
}

const DEFAULT_TEMPLATE: ContractSection[] = [
    {
        id: "partes",
        title: "1. AS PARTES",
        content: "CONTRATANTE (LOCATÁRIO): {{inquilino_nome}}, inscrito(a) no CPF sob o nº {{inquilino_cpf}}, portador(a) do RG nº {{inquilino_rg}}, e-mail {{inquilino_email}}, telefone {{inquilino_telefone}}.\n\nCONTRATADA (ENTREGA FACILITADA): ENTREGA FACILITADA GESTAO E TECNOLOGIA LTDA, pessoa jurídica de direito privado, operadora da solução tecnológica para garantia locatícia e serviços de vistoria."
    },
    {
        id: "objeto",
        title: "2. O OBJETO",
        content: "O presente contrato tem como objeto a prestação de serviços de garantia e intermediação tecnológica \"Entrega Facilitada\" referente ao imóvel objeto da locação situado no endereço:\n\n{{endereco_imovel}}"
    },
    {
        id: "servicos",
        title: "3. DOS SERVIÇOS E OBRIGAÇÕES",
        content: "Cláusula 3.1: A CONTRATADA compromete-se a fornecer a gestão da vistoria de entrada e saída, e garantia jurídica das condições de encerramento da locação.\n\nCláusula 3.2: O CONTRATANTE reconhece como válidas as vistorias geradas através da plataforma da CONTRATADA.\n\nCláusula 3.3: Como contraprestação, o CONTRATANTE realizará o pagamento das mensalidades ou anuidades configuradas em sistema, cuja inadimplência implicará em suspensão dos serviços e comunicação direta aos proprietários/imobiliária administradora."
    },
    {
        id: "assinatura",
        title: "4. ASSINATURA ELETRÔNICA",
        content: "As partes acordam e reconhecem a validade da assinatura eletrônica por meio da plataforma Autentique, nos termos da Medida Provisória nº 2.200-2/2001, que instituiu a Infra-Estrutura de Chaves Públicas Brasileira (ICP-Brasil)."
    }
];

const VARIABLES = [
    { tag: "{{inquilino_nome}}", label: "Nome do Inquilino" },
    { tag: "{{inquilino_cpf}}", label: "CPF do Inquilino" },
    { tag: "{{inquilino_rg}}", label: "RG do Inquilino" },
    { tag: "{{inquilino_email}}", label: "E-mail do Inquilino" },
    { tag: "{{inquilino_telefone}}", label: "Telefone do Inquilino" },
    { tag: "{{endereco_imovel}}", label: "Endereço Completo" },
    { tag: "{{data_atual}}", label: "Data Atual" },
    { tag: "{{cidade_estado}}", label: "Cidade/Estado" },
];

const ContratoPadraoPage = () => {
    const [title, setTitle] = useState("CONTRATO DE PRESTAÇÃO DE SERVIÇOS - ENTREGA FACILITADA");
    const [sections, setSections] = useState<ContractSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    useEffect(() => {
        loadTemplate();
    }, []);

    const loadTemplate = async () => {
        try {
            const { data, error } = await supabase
                .from('pricing_parameters_config')
                .select('contract_template')
                .eq('id', 1)
                .single();

            if (data?.contract_template) {
                // Suporte ao formato antigo (array) e novo (objeto com title e sections)
                if (Array.isArray(data.contract_template)) {
                    setSections(data.contract_template);
                } else if (data.contract_template.sections) {
                    setSections(data.contract_template.sections);
                    if (data.contract_template.title) setTitle(data.contract_template.title);
                }
            } else {
                setSections(DEFAULT_TEMPLATE);
            }
        } catch (error) {
            console.error("Erro ao carregar template:", error);
            setSections(DEFAULT_TEMPLATE);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('pricing_parameters_config')
                .update({
                    contract_template: {
                        title: title,
                        sections: sections
                    },
                    updated_at: new Date().toISOString()
                })
                .eq('id', 1);

            if (error) throw error;
            toast.success("Template de contrato salvo com sucesso!");
        } catch (error: any) {
            console.error(error);
            toast.error("Erro ao salvar template. Verifique a conexão com o banco.");
        } finally {
            setIsSaving(false);
        }
    };

    const updateSection = (id: string, field: keyof ContractSection, value: string) => {
        setSections(ps => ps.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const removeSection = (id: string) => {
        if (sections.length <= 1) {
            toast.error("O contrato precisa de pelo menos uma seção.");
            return;
        }
        setSections(ps => ps.filter(s => s.id !== id));
    };

    const addSection = () => {
        const newId = Math.random().toString(36).substr(2, 9);
        setSections(ps => [...ps, { id: newId, title: "Nova Seção", content: "" }]);
    };

    const moveSection = (index: number, direction: 'up' | 'down') => {
        const newSections = [...sections];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= sections.length) return;

        [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
        setSections(newSections);
    };

    const insertVariable = (sectionId: string, variable: string) => {
        const section = sections.find(s => s.id === sectionId);
        if (section) {
            updateSection(sectionId, 'content', section.content + " " + variable);
        }
    };

    if (loading) {
        return (
            <DashboardLayout role="admin">
                <div className="flex h-[50vh] items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-secondary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">Contrato Padrão EF</h1>
                        <p className="text-muted-foreground">Configure as cláusulas e seções do contrato de adesão gerado para os inquilinos.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setPreviewMode(!previewMode)}
                            className="gap-2"
                        >
                            {previewMode ? <Code className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            {previewMode ? "Modo Edição" : "Visualizar"}
                        </Button>
                        {!previewMode && (
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2 shadow-lg shadow-secondary/20"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Salvar Alterações
                            </Button>
                        )}
                    </div>
                </header>

                {previewMode ? (
                    <Card className="border-border/50 bg-card/60 backdrop-blur-sm max-w-3xl mx-auto shadow-2xl">
                        <CardHeader className="text-center border-b border-border/50 pb-8">
                            <CardTitle className="text-2xl font-black uppercase text-secondary">{title}</CardTitle>
                            <CardDescription>Visualização em tempo real (Exemplo)</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-8 text-justify font-serif text-sm leading-relaxed px-12">
                            {sections.map((section) => (
                                <div key={section.id} className="space-y-3">
                                    <h3 className="font-bold text-base uppercase border-b border-border/30 pb-1">{section.title}</h3>
                                    <p className="whitespace-pre-wrap text-foreground/80">
                                        {section.content
                                            .replace(/\{\{inquilino_nome\}\}/g, "JOÃO DA SILVA EXEMPLO")
                                            .replace(/\{\{inquilino_cpf\}\}/g, "000.000.000-00")
                                            .replace(/\{\{endereco_imovel\}\}/g, "Rua Exemplo, 123 - Centro, Franca/SP")}
                                    </p>
                                </div>
                            ))}

                            <div className="mt-20 pt-10 text-center border-t border-border/30">
                                <div className="w-48 h-0.5 bg-foreground/20 mx-auto mb-2" />
                                <p className="font-bold">ASSINATURA DIGITAL DO LOCALATÁRIO</p>
                                <p className="text-[10px] text-muted-foreground uppercase">Autenticado via plataforma Autentique</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="border-secondary/30 bg-secondary/5">
                                <CardHeader className="py-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="w-4 h-4 text-secondary" />
                                        <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Título do Contrato</Label>
                                    </div>
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value.toUpperCase())}
                                        className="text-lg font-black uppercase tracking-tight bg-background/50 border-secondary/20 focus:border-secondary h-12"
                                        placeholder="EX: CONTRATO DE PRESTAÇÃO DE SERVIÇOS"
                                    />
                                </CardHeader>
                            </Card>

                            {sections.map((section, index) => (
                                <Card key={section.id} className="border-border/50 bg-card/50 shadow-sm hover:shadow-md transition-shadow group">
                                    <CardHeader className="py-3 border-b border-border/30 bg-muted/30 flex flex-row items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    disabled={index === 0}
                                                    onClick={() => moveSection(index, 'up')}
                                                >
                                                    <ChevronUp className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    disabled={index === sections.length - 1}
                                                    onClick={() => moveSection(index, 'down')}
                                                >
                                                    <ChevronDown className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                            <Input
                                                value={section.title}
                                                onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                                                className="font-bold border-transparent bg-transparent hover:bg-background/50 focus:bg-background text-foreground h-9"
                                                placeholder="Título da Seção"
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeSection(section.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-4">
                                        <Textarea
                                            value={section.content}
                                            onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                                            placeholder="Conteúdo da cláusula..."
                                            className="min-h-[150px] bg-background/50 focus:bg-background border-border/30 resize-y leading-relaxed"
                                        />
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground py-1">Inserir:</span>
                                            {VARIABLES.map(v => (
                                                <Badge
                                                    key={v.tag}
                                                    variant="secondary"
                                                    className="cursor-pointer hover:bg-secondary hover:text-secondary-foreground transition-colors text-[10px] py-0.5 px-2"
                                                    onClick={() => insertVariable(section.id, v.tag)}
                                                >
                                                    {v.label}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            <Button
                                variant="outline"
                                className="w-full border-dashed py-8 bg-background/30 hover:bg-background/50 gap-2 border-2 text-muted-foreground"
                                onClick={addSection}
                            >
                                <Plus className="w-5 h-5" />
                                Adicionar Nova Seção / Cláusula
                            </Button>
                        </div>

                        <div className="space-y-6">
                            <Card className="border-secondary/20 bg-secondary/5 sticky top-24">
                                <CardHeader className="pb-3 border-b border-secondary/10">
                                    <div className="flex items-center gap-2">
                                        <Info className="w-5 h-5 text-secondary" />
                                        <CardTitle className="text-base">Dicas de Edição</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4 text-sm text-muted-foreground">
                                    <p>
                                        Use os <strong className="text-foreground">Atalhos de Variáveis</strong> abaixo de cada caixa de texto para inserir dados dinâmicos do inquilino.
                                    </p>
                                    <Separator className="bg-secondary/10" />
                                    <p className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0 mt-1.5" />
                                        Mantenha os títulos numerados para melhor organização.
                                    </p>
                                    <p className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0 mt-1.5" />
                                        As variáveis serão substituídas pelos dados reais no momento da contratação.
                                    </p>
                                    <div className="p-3 bg-background/50 rounded-lg border border-secondary/20 italic text-xs">
                                        Dica: Use "Visualizar" no topo para ver como o texto está fluindo sem as caixas de edição.
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ContratoPadraoPage;

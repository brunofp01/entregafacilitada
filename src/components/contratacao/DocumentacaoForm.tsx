import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileUp, Info, CheckCircle2, Link as LinkIcon, Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DocumentacaoFormProps {
    contratoFile: File | null;
    onContratoFileChange: (file: File | null) => void;
    vistoriaTipo: "plataforma" | "upload";
    onVistoriaTipoChange: (tipo: "plataforma" | "upload") => void;
    vistoriaFile: File | null;
    onVistoriaFileChange: (file: File | null) => void;
    vistoriaIdVinculada: string;
    onVistoriaIdVinculadaChange: (id: string) => void;
    vistoriasConcluidas: any[];
    fetchingVistorias: boolean;
    userRole: string;
    isVistoriaIntegrada: boolean;
}

export const DocumentacaoForm = ({
    contratoFile,
    onContratoFileChange,
    vistoriaTipo,
    onVistoriaTipoChange,
    vistoriaFile,
    onVistoriaFileChange,
    vistoriaIdVinculada,
    onVistoriaIdVinculadaChange,
    vistoriasConcluidas,
    fetchingVistorias,
    userRole,
    isVistoriaIntegrada
}: DocumentacaoFormProps) => {
    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-border/50 bg-secondary/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                        <FileUp className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                        <CardTitle>Anexar Documentos</CardTitle>
                        <CardDescription>O contrato de locação e vistoria original.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
                {/* Contrato Locacao */}
                <div className="space-y-3">
                    <div>
                        <Label className="text-base font-bold">1. Contrato de Locação *</Label>
                        <p className="text-sm text-muted-foreground mb-4">Insira o pdf do contrato de locação já devidamente assinado pelo inquilino e locador.</p>
                    </div>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="contrato-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-background hover:bg-muted transition-colors border-secondary/40">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <FileUp className="w-8 h-8 mb-3 text-secondary/70" />
                                <p className="mb-2 text-sm text-muted-foreground">
                                    <span className="font-semibold text-secondary">Clique para fazer upload</span> do contrato (PDF)
                                </p>
                                {contratoFile && <p className="text-xs font-bold text-emerald-500 mt-2 bg-emerald-500/10 px-3 py-1 rounded-full">{contratoFile.name}</p>}
                            </div>
                            <input id="contrato-file" type="file" className="hidden" accept=".pdf" onChange={e => onContratoFileChange(e.target.files?.[0] || null)} />
                        </label>
                    </div>
                </div>

                {isVistoriaIntegrada ? (
                    <div className="mt-8 bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl flex items-start gap-4">
                        <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <Label className="text-base font-bold text-emerald-700 dark:text-emerald-400">2. Laudo de Vistoria Integrado via Plataforma</Label>
                            <p className="text-sm font-semibold text-emerald-600/80 dark:text-emerald-400/80 mt-1">A Vistoria de Plataforma compatível foi selecionada na Sessão 2. O anexo será vinculado automaticamente à vida do contrato. Se você quer mudar, altere na Sessão 2!</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 pt-4 border-t border-border mt-4">
                        <div>
                            <Label className="text-base font-bold">2. Laudo de Vistoria do Imóvel *</Label>
                            <p className="text-sm text-muted-foreground mb-4">
                                Como você prefere anexar a vistoria inicial deste imóvel?
                            </p>
                        </div>

                        <div className="bg-muted/10 p-5 rounded-xl border border-border space-y-6">
                            <RadioGroup
                                defaultValue={vistoriaTipo}
                                onValueChange={onVistoriaTipoChange}
                                className="flex flex-col space-y-4"
                                disabled={userRole === 'inquilino'}
                            >
                                <div className="flex items-start space-x-3">
                                    <RadioGroupItem value="upload" id="upload" className="mt-1" />
                                    <div>
                                        <Label htmlFor="upload" className="text-base cursor-pointer">Fazer Upload de Arquivo Manualmente</Label>
                                        <p className="text-sm text-muted-foreground">Use se a vistoria já foi feita externamente fora da plataforma e você tem o PDF.</p>
                                    </div>
                                </div>
                                {userRole !== 'inquilino' && (
                                    <div className="flex items-start space-x-3">
                                        <RadioGroupItem value="plataforma" id="plataforma" className="mt-1" />
                                        <div>
                                            <Label htmlFor="plataforma" className="text-base flex items-center gap-2 cursor-pointer">
                                                Vincular a uma Vistoria da Plataforma Existente
                                            </Label>
                                            <p className="text-sm text-muted-foreground">Selecione uma vistoria gerada aqui dentro da plataforma para vincular.</p>
                                        </div>
                                    </div>
                                )}
                            </RadioGroup>

                            <div className="pt-2 pl-7">
                                {vistoriaTipo === "upload" ? (
                                    <div className="animate-in slide-in-from-top-2 fade-in">
                                        <label htmlFor="vistoria-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-background hover:bg-muted transition-colors border-border/60 hover:border-secondary/50">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <FileUp className="w-8 h-8 mb-3 text-muted-foreground/50" />
                                                <p className="text-sm text-muted-foreground">Clique para enviar o **PDF da vistoria**</p>
                                                {vistoriaFile && <p className="text-xs font-bold text-emerald-500 mt-2 bg-emerald-500/10 px-3 py-1 rounded-full">{vistoriaFile.name}</p>}
                                            </div>
                                            <input id="vistoria-file" type="file" className="hidden" accept=".pdf" onChange={e => onVistoriaFileChange(e.target.files?.[0] || null)} />
                                        </label>
                                    </div>
                                ) : (
                                    <div className="animate-in slide-in-from-top-2 fade-in space-y-3">
                                        <div className="flex items-start gap-2 bg-blue-500/10 text-blue-600 p-3 rounded-lg text-xs md:text-sm border border-blue-500/20">
                                            <Info className="w-5 h-5 shrink-0 mt-0.5" />
                                            <p>
                                                Abaixo listamos apenas as vistorias <strong>FINALIZADAS (LAUDO DISPONÍVEL)</strong> geradas na plataforma que não foram atreladas a nenhum inquilino.
                                            </p>
                                        </div>
                                        {fetchingVistorias ? (
                                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                                <Loader2 className="w-4 h-4 animate-spin" /> Buscando vistorias concluídas...
                                            </div>
                                        ) : vistoriasConcluidas.length > 0 ? (
                                            <Select onValueChange={onVistoriaIdVinculadaChange} value={vistoriaIdVinculada}>
                                                <SelectTrigger className="w-full text-left h-auto py-3">
                                                    <SelectValue placeholder="Selecione uma vistoria concluída..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {vistoriasConcluidas.map(v => (
                                                        <SelectItem key={v.id} value={v.id}>
                                                            <div className="flex items-center gap-2">
                                                                <LinkIcon className="w-4 h-4 text-secondary/70 shrink-0" />
                                                                <span>{v.rua}{v.numero ? `, nº ${v.numero}` : ''} - {v.cidade}</span>
                                                                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-2">ID: {v.id.split('-')[0]}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="text-sm font-bold text-destructive bg-destructive/10 p-4 border border-destructive/20 rounded-lg">
                                                Você não possui nenhuma vistoria "Concluída" pronta para ser vinculada. Adicione a Vistoria manualmente por upload.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

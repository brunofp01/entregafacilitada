import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Home, Info, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ImovelFormProps {
    data: {
        cep: string;
        rua: string;
        numero: string;
        complemento: string;
        bairro: string;
        cidade: string;
        estado: string;
        area: string;
    };
    onChange: (data: any) => void;
    onCepSearch: (cep: string) => void;
    userRole: string;
    matchingVistorias: any[];
    vistoriaTipo: string;
    vistoriaIdVinculada: string;
    onVistoriaSelect: (id: string) => void;
    showComplementWarning?: boolean;
    selectedVistoria?: any;
}

export const ImovelForm = ({
    data,
    onChange,
    onCepSearch,
    userRole,
    matchingVistorias,
    vistoriaTipo,
    vistoriaIdVinculada,
    onVistoriaSelect,
    showComplementWarning,
    selectedVistoria
}: ImovelFormProps) => {
    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-border/50 bg-secondary/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                        <Home className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                        <CardTitle>Imóvel Alugado</CardTitle>
                        <CardDescription>O endereço do imóvel da locação contratada.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                <div className="grid md:grid-cols-4 gap-4">
                    <div className="space-y-2 col-span-2 md:col-span-1">
                        <Label>CEP *</Label>
                        <Input required placeholder="00000-000" value={data.cep} onChange={e => onCepSearch(e.target.value)} maxLength={9} />
                    </div>
                    <div className="md:col-span-3 space-y-2">
                        <Label>Rua / Logradouro *</Label>
                        <Input required placeholder="Rua Presidente Kennedy..." value={data.rua} onChange={e => onChange({ ...data, rua: e.target.value })} />
                    </div>
                </div>
                <div className="grid md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label>Número *</Label>
                        <Input required placeholder="123" value={data.numero} onChange={e => onChange({ ...data, numero: e.target.value })} />
                    </div>
                    <div className="md:col-span-3 space-y-2">
                        <Label>Complemento</Label>
                        <Input placeholder="Apto 12..." value={data.complemento} onChange={e => onChange({ ...data, complemento: e.target.value })} />
                    </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Bairro *</Label>
                        <Input required placeholder="Centro" value={data.bairro} onChange={e => onChange({ ...data, bairro: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <Label>Cidade *</Label>
                        <Input required placeholder="Franca" value={data.cidade} onChange={e => onChange({ ...data, cidade: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <Label>Estado (UF) *</Label>
                        <Input required placeholder="SP" value={data.estado} onChange={e => onChange({ ...data, estado: e.target.value })} maxLength={2} />
                    </div>
                </div>

                {userRole !== 'inquilino' && matchingVistorias.length > 0 && (
                    <div className="mt-6 p-5 border border-amber-500/30 bg-amber-500/10 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-4 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shrink-0 shadow-md">
                                <Info className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-amber-600 dark:text-amber-500 tracking-tight">Vistoria Compatível Encontrada!</h4>
                                <p className="text-sm font-semibold text-amber-700/90 dark:text-amber-400/80 mt-1">A plataforma detectou {matchingVistorias.length} vistoria(s) concluída(s) para o endereço <strong>{data.rua}, {data.numero}</strong>. Selecione abaixo para vincular automaticamente.</p>
                            </div>
                        </div>
                        <div className="pl-14">
                            <Select
                                value={vistoriaTipo === 'plataforma' ? vistoriaIdVinculada : ""}
                                onValueChange={onVistoriaSelect}
                            >
                                <SelectTrigger className="w-full bg-background border-amber-500/40 text-foreground font-bold border-2 focus:ring-amber-500 h-12">
                                    <SelectValue placeholder="Toque para vincular a vistoria correspondente a este endereço..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {matchingVistorias.map(v => (
                                        <SelectItem key={v.id} value={v.id} className="font-semibold cursor-pointer py-3">
                                            <div className="flex items-center gap-3">
                                                <LinkIcon className="w-4 h-4 text-amber-500 shrink-0" />
                                                <span>Vistoria Validada: {v.complemento ? `${v.rua}, n ${v.numero} - ${v.complemento}` : `${v.rua}, n ${v.numero}`}</span>
                                                <span className="text-[10px] uppercase font-black text-white bg-amber-500 px-2 py-0.5 rounded-full border border-amber-600/50 shadow-sm ml-2">ID: {v.id.split('-')[0]}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {showComplementWarning && (
                                <div className="mt-4 text-xs font-bold leading-relaxed bg-white dark:bg-background border-2 border-red-500/50 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                                    <div className="w-2.5 h-2.5 mt-0.5 rounded-full bg-red-500 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                                    <span><strong>ATENÇÃO:</strong> O complemento informado para este imóvel <strong>({data.complemento})</strong> não é exatamente igual ao complemento da vistoria selecionada <strong>({selectedVistoria?.complemento})</strong>. Confirme com atenção se você está usando a vistoria do apartamento correto antes de emitir o contrato!</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {vistoriaTipo === 'plataforma' && vistoriaIdVinculada && matchingVistorias.find(v => v.id === vistoriaIdVinculada) ? (
                    <div className="mt-6 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
                        <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Parâmetro de Análise</h3>
                        <div className="space-y-2 max-w-[240px]">
                            <Label>Metragem Computada (m²)</Label>
                            <Input
                                type="number"
                                value={data.area}
                                readOnly
                                className="font-mono text-emerald-600 font-bold bg-emerald-50 border-emerald-200 h-11 text-lg dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-500/30"
                            />
                            <p className="text-[10px] text-muted-foreground font-semibold mt-1">Preenchido e travado pela vistoria.</p>
                        </div>
                    </div>
                ) : (
                    <div className="mt-6 pt-4 border-t border-border/50">
                        <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">Parâmetro de Análise</h3>
                        <div className="space-y-2 max-w-[240px]">
                            <Label>Metragem (m²) *</Label>
                            <Input
                                type="number"
                                required
                                placeholder="Ex: 85"
                                value={data.area}
                                onChange={e => onChange({ ...data, area: e.target.value })}
                                className="font-mono text-secondary font-bold bg-secondary/5 border-secondary/30 h-11"
                            />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

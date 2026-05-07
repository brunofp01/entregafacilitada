import React, { useEffect, useState } from "react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { Building2, User, Key, Search, Calculator, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

export function CommandSearch() {
    const [open, setOpen] = useState(false);
    const [inquilinos, setInquilinos] = useState<{ id: string, nome: string }[]>([]);
    const [imobiliarias, setImobiliarias] = useState<{ id: string, full_name: string }[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const fetchData = async () => {
        const { data: inq } = await supabase.from("inquilinos").select("id, nome").limit(5);
        const { data: imob } = await supabase.from("profiles").select("id, full_name").eq("role", "imobiliaria").limit(5);
        if (inq) setInquilinos(inq);
        if (imob) setImobiliarias(imob);
    };

    useEffect(() => {
        if (open) fetchData();
    }, [open]);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 border border-border/50 rounded-lg hover:bg-muted transition-colors"
            >
                <Search className="w-3.5 h-3.5" />
                <span>Busca rápida...</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="O que você está procurando?" />
                <CommandList>
                    <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
                    
                    <CommandGroup heading="Atalhos">
                        <CommandItem onSelect={() => runCommand(() => navigate("/admin/aprovacoes"))}>
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Ver Aprovações</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate("/imobiliaria/contratar"))}>
                            <Calculator className="mr-2 h-4 w-4" />
                            <span>Nova Contratação</span>
                        </CommandItem>
                    </CommandGroup>
                    
                    <CommandSeparator />
                    
                    <CommandGroup heading="Inquilinos Recentes">
                        {inquilinos.map((i) => (
                            <CommandItem key={i.id} onSelect={() => runCommand(() => navigate(`/imobiliaria/inquilinos`))}>
                                <User className="mr-2 h-4 w-4" />
                                <span>{i.nome}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                    
                    <CommandSeparator />
                    
                    <CommandGroup heading="Imobiliárias">
                        {imobiliarias.map((i) => (
                            <CommandItem key={i.id} onSelect={() => runCommand(() => navigate(`/admin/imobiliarias`))}>
                                <Building2 className="mr-2 h-4 w-4" />
                                <span>{i.full_name}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
}

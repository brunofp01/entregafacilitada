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
import { Building2, User, Search, Calculator, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

export function CommandSearch() {
    const [open, setOpen] = useState(false);
    const [inquilinos, setInquilinos] = useState<{ id: string, nome: string }[]>([]);
    const [imobiliarias, setImobiliarias] = useState<{ id: string, full_name: string }[]>([]);
    const navigate = useNavigate();
    const { profile } = useAuth();

    const isAdmin = profile?.role === "admin" || profile?.role === "admin_master" || profile?.role === "equipe_ef";
    const isImobiliaria = profile?.role === "imobiliaria" || profile?.role === "integrante_imobiliaria";

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                // Only allow open if not a tenant
                if (!isAdmin && !isImobiliaria) return;
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [isAdmin, isImobiliaria]);

    const fetchData = async () => {
        if (!profile) return;

        // 1. Fetch Inquilinos (Filtered if Imobiliaria)
        let inqQuery = supabase.from("inquilinos").select("id, nome").limit(5);
        if (isImobiliaria && profile.imobiliaria_id) {
            inqQuery = inqQuery.eq("imobiliaria_id", profile.imobiliaria_id);
        } else if (isImobiliaria) {
            inqQuery = inqQuery.eq("imobiliaria_id", profile.id);
        }
        
        const { data: inq } = await inqQuery;
        if (inq) setInquilinos(inq);

        // 2. Fetch Imobiliarias (Admin only)
        if (isAdmin) {
            const { data: imob } = await supabase.from("profiles").select("id, full_name").eq("role", "imobiliaria").limit(5);
            if (imob) setImobiliarias(imob);
        }
    };

    useEffect(() => {
        if (open) fetchData();
    }, [open]);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    // Tenants cannot see the search at all
    if (!isAdmin && !isImobiliaria) return null;

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
                        {isAdmin && (
                            <CommandItem onSelect={() => runCommand(() => navigate("/admin/aprovacoes"))}>
                                <FileText className="mr-2 h-4 w-4" />
                                <span>Ver Aprovações</span>
                            </CommandItem>
                        )}
                        <CommandItem onSelect={() => runCommand(() => navigate("/imobiliaria/contratar"))}>
                            <Calculator className="mr-2 h-4 w-4" />
                            <span>Nova Contratação</span>
                        </CommandItem>
                    </CommandGroup>
                    
                    {inquilinos.length > 0 && (
                        <>
                            <CommandSeparator />
                            <CommandGroup heading="Inquilinos Recentes">
                                {inquilinos.map((i) => (
                                    <CommandItem key={i.id} onSelect={() => runCommand(() => navigate(`/imobiliaria/inquilinos`))}>
                                        <User className="mr-2 h-4 w-4" />
                                        <span>{i.nome}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </>
                    )}
                    
                    {isAdmin && imobiliarias.length > 0 && (
                        <>
                            <CommandSeparator />
                            <CommandGroup heading="Imobiliárias">
                                {imobiliarias.map((i) => (
                                    <CommandItem key={i.id} onSelect={() => runCommand(() => navigate(`/admin/imobiliarias`))}>
                                        <Building2 className="mr-2 h-4 w-4" />
                                        <span>{i.full_name}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
}

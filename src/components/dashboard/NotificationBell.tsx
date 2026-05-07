import { useState, useEffect } from "react";
import { Bell, BellDot, Check, Trash2, ExternalLink } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    read: boolean;
    link?: string;
    created_at: string;
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(10);

            if (error) {
                // If table doesn't exist yet, we'll silently fail or show a mock for now
                console.warn("Notifications table might not exist yet:", error.message);
                return;
            }

            setNotifications(data || []);
            setUnreadCount((data || []).filter(n => !n.read).length);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Subscribe to real-time notifications
        const channel = supabase
            .channel('public:notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
                fetchNotifications();
                toast.info("Nova notificação recebida!");
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const markAsRead = async (id: string) => {
        const { error } = await supabase
            .from("notifications")
            .update({ read: true })
            .eq("id", id);

        if (!error) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const deleteNotification = async (id: string) => {
        const { error } = await supabase
            .from("notifications")
            .delete()
            .eq("id", id);

        if (!error) {
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (notifications.find(n => n.id === id && !n.read)) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "success": return "bg-emerald-500";
            case "warning": return "bg-amber-500";
            case "error": return "bg-red-500";
            default: return "bg-blue-500";
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-secondary/10 transition-colors">
                    {unreadCount > 0 ? (
                        <>
                            <BellDot className="w-5 h-5 text-secondary animate-pulse" />
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-background">
                                {unreadCount}
                            </span>
                        </>
                    ) : (
                        <Bell className="w-5 h-5 text-muted-foreground" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 border-border/50 bg-card/95 backdrop-blur-md shadow-2xl">
                <DropdownMenuLabel className="p-4 flex items-center justify-between border-b border-border/50">
                    <span className="font-heading font-bold text-base">Notificações</span>
                    {unreadCount > 0 && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
                            {unreadCount} novas
                        </span>
                    )}
                </DropdownMenuLabel>
                
                <ScrollArea className="h-80">
                    {loading ? (
                        <div className="p-8 text-center text-xs text-muted-foreground">Carregando...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center gap-3">
                            <Bell className="w-10 h-10 text-muted-foreground/20" />
                            <p className="text-sm text-muted-foreground font-medium italic">Nenhuma notificação por aqui.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/30">
                            {notifications.map((n) => (
                                <div 
                                    key={n.id} 
                                    className={cn(
                                        "p-4 transition-colors relative group",
                                        !n.read ? "bg-secondary/5" : "hover:bg-muted/30"
                                    )}
                                >
                                    <div className="flex gap-3">
                                        <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", getTypeColor(n.type))} />
                                        <div className="flex-1 min-w-0">
                                            <p className={cn("text-xs font-bold leading-none mb-1", !n.read ? "text-foreground" : "text-muted-foreground")}>
                                                {n.title}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed mb-2 line-clamp-2">
                                                {n.message}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-semibold text-muted-foreground/60 uppercase">
                                                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                                                </span>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!n.read && (
                                                        <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full h-auto py-1" onClick={() => markAsRead(n.id)}>
                                                            <Check className="w-3 h-3 text-emerald-500" />
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full h-auto py-1" onClick={() => deleteNotification(n.id)}>
                                                        <Trash2 className="w-3 h-3 text-red-500" />
                                                    </Button>
                                                    {n.link && (
                                                        <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full h-auto py-1" asChild>
                                                            <a href={n.link}><ExternalLink className="w-3 h-3" /></a>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                
                <DropdownMenuSeparator />
                <DropdownMenuItem className="p-3 text-center justify-center text-xs font-bold text-secondary cursor-pointer hover:bg-secondary/5 focus:bg-secondary/5">
                    Ver todas as atividades
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

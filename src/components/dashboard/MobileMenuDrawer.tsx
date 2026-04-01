import { Drawer } from "vaul";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  User, 
  LogOut, 
  Shield, 
  HelpCircle, 
  Bell 
} from "lucide-react";

interface MobileMenuDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  role: string;
}

export const MobileMenuDrawer = ({ open, onOpenChange, userName, role }: MobileMenuDrawerProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onOpenChange(false);
    navigate("/");
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[100]" />
        <Drawer.Content className="bg-card flex flex-col rounded-t-[20px] h-[70vh] mt-24 fixed bottom-0 left-0 right-0 z-[101] outline-none border-t border-border">
          <div className="flex-1 p-4 bg-card rounded-t-[20px]">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-8" />
            
            <div className="flex items-center gap-4 mb-8 px-2">
              <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary font-bold text-2xl border border-secondary/20 shadow-inner">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-xl">{userName}</h3>
                <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold">{role}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 mb-8">
              <Link 
                to="/perfil" 
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <User className="w-5 h-5" />
                </div>
                <span className="font-bold">Meu Perfil</span>
              </Link>

              <Link 
                to="/configuracoes" 
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-500/10 flex items-center justify-center text-slate-500">
                  <Settings className="w-5 h-5" />
                </div>
                <span className="font-bold">Configurações</span>
              </Link>

              <Link 
                to="/notificacoes" 
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                  <Bell className="w-5 h-5" />
                </div>
                <span className="font-bold">Notificações</span>
              </Link>

              <div className="h-px bg-border my-2 mx-4" />

              <Link 
                to="/ajuda" 
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <span className="font-semibold text-muted-foreground">Ajuda & Suporte</span>
              </Link>
            </div>

            <Button 
              onClick={handleLogout}
              variant="outline"
              className="w-full h-14 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive font-bold gap-3"
            >
              <LogOut className="w-5 h-5" />
              Sair da Conta
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

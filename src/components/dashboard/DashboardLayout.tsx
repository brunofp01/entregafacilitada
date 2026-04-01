import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User,
  Bell
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "admin" | "imobiliaria" | "inquilino";
}

const DashboardLayout = ({ children, role }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .single();
      
      setUserName(profile?.full_name || user.email?.split("@")[0] || "Usuário");
    };
    getProfile();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const menuItems = {
    admin: [
      { icon: LayoutDashboard, label: "Visão Geral", href: "/admin" },
      { icon: Building2, label: "Imobiliárias", href: "/admin/imobiliarias" },
      { icon: Users, label: "Usuários", href: "/admin/usuarios" },
      { icon: FileText, label: "Relatórios", href: "/admin/relatorios" },
      { icon: Settings, label: "Configurações", href: "/admin/configuracoes" },
    ],
    imobiliaria: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/imobiliaria" },
      { icon: Users, label: "Inquilinos", href: "/imobiliaria/inquilinos" },
      { icon: FileText, label: "Contratos", href: "/imobiliaria/contratos" },
      { icon: Settings, label: "Configurações", href: "/imobiliaria/configuracoes" },
    ],
    inquilino: [
      { icon: LayoutDashboard, label: "Meu Plano", href: "/inquilino" },
      { icon: FileText, label: "Pagamentos", href: "/inquilino/pagamentos" },
      { icon: User, label: "Meu Perfil", href: "/inquilino/perfil" },
    ],
  };

  const items = menuItems[role];

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-card border-r border-border transition-all duration-300 z-30 flex flex-col",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center text-secondary-foreground font-bold">
              EF
            </div>
            {isSidebarOpen && (
              <span className="font-heading font-bold text-lg text-foreground truncate">
                Entrega <span className="text-secondary">Facilitada</span>
              </span>
            )}
          </Link>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {items.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link 
                key={item.href} 
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
                  isActive 
                    ? "bg-secondary text-secondary-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "" : "group-hover:scale-110 transition-transform")} />
                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span>Sair</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6 z-20">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full border-2 border-background" />
            </Button>
            
            <div className="flex items-center gap-3 pl-4 border-l border-border text-sm">
              <div className="text-right hidden sm:block">
                <p className="font-bold text-foreground truncate max-w-[150px]">{userName}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold border border-secondary/20 shadow-inner">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-2"
              onClick={handleLogout}
              title="Sair da plataforma"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

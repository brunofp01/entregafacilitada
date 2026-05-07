import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
  Calculator,
  Package,
  ClipboardCheck,
  Shield,
  Key,
  MessageSquare,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileMenuDrawer } from "./MobileMenuDrawer";
import { NotificationBell } from "./NotificationBell";
import { CommandSearch } from "./CommandSearch";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "admin" | "imobiliaria" | "inquilino" | "integrante_imobiliaria" | "admin_master" | "equipe_ef";
}

const DashboardLayout = ({ children, role }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const menuItems = {
    admin: [
      { icon: LayoutDashboard, label: "Visão Geral", href: "/admin" },
      { icon: ClipboardCheck, label: "Aprovações", href: "/admin/aprovacoes" },
      { icon: MessageSquare, label: "Leads Simulador", href: "/admin/leads" },
      { icon: ShoppingCart, label: "Contratar EF", href: "/imobiliaria/contratar" },
      { icon: Package, label: "Gestão de Planos", href: "/admin/planos" },
      { icon: Building2, label: "Cadastrar Imobiliária", href: "/admin/imobiliarias/nova" },
      { icon: Building2, label: "Imobiliárias", href: "/admin/imobiliarias" },
      { icon: Users, label: "Usuários", href: "/admin/usuarios" },
      { icon: FileText, label: "Relatórios", href: "/admin/relatorios" },
      { icon: FileText, label: "Contrato Padrão", href: "/admin/contrato-padrao" },
      { icon: Calculator, label: "Parâmetros", href: "/admin/parametros" },
      { icon: User, label: "Meu Perfil", href: "/admin/perfil" },
      { icon: Settings, label: "Configurações", href: "/admin/configuracoes" },
    ],
    admin_master: [
      { icon: LayoutDashboard, label: "Visão Geral", href: "/admin" },
      { icon: ClipboardCheck, label: "Aprovações", href: "/admin/aprovacoes" },
      { icon: MessageSquare, label: "Leads Simulador", href: "/admin/leads" },
      { icon: ShoppingCart, label: "Contratar EF", href: "/imobiliaria/contratar" },
      { icon: Package, label: "Gestão de Planos", href: "/admin/planos" },
      { icon: Building2, label: "Cadastrar Imobiliária", href: "/admin/imobiliarias/nova" },
      { icon: Building2, label: "Imobiliárias", href: "/admin/imobiliarias" },
      { icon: Users, label: "Usuários", href: "/admin/usuarios" },
      { icon: FileText, label: "Relatórios", href: "/admin/relatorios" },
      { icon: FileText, label: "Contrato Padrão", href: "/admin/contrato-padrao" },
      { icon: Calculator, label: "Parâmetros", href: "/admin/parametros" },
      { icon: User, label: "Meu Perfil", href: "/admin/perfil" },
      { icon: Settings, label: "Configurações", href: "/admin/configuracoes" },
    ],
    equipe_ef: [
      { icon: LayoutDashboard, label: "Visão Geral", href: "/admin" },
      {icon: ClipboardCheck, label: "Aprovações", href: "/admin/aprovacoes" },
      {icon: Key, label: "Solicitações de Entrega", href: "/admin/solicitacoes" },
      {icon: Building2, label: "Imobiliárias", href: "/admin/imobiliarias" },
      { icon: MessageSquare, label: "Leads Simulador", href: "/admin/leads" },
      { icon: Users, label: "Usuários", href: "/admin/usuarios" },
      { icon: User, label: "Meu Perfil", href: "/admin/perfil" },
    ],
    imobiliaria: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/imobiliaria" },
      { icon: ShoppingCart, label: "Contratar EF", href: "/imobiliaria/contratar" },
      {icon: Users, label: "Clientes EF", href: "/imobiliaria/inquilinos" },
      {icon: Key, label: "Solicitações de Entrega", href: "/imobiliaria/solicitacoes" },
      {icon: FileText, label: "Vistorias", href: "/imobiliaria/vistorias" },
      { icon: Shield, label: "Seguros e Garantias", href: "/imobiliaria/seguros" },
      { icon: Users, label: "Minha Equipe", href: "/imobiliaria/equipe" },
      { icon: Building2, label: "Perfil da Imobiliária", href: "/imobiliaria/perfil" },
      { icon: User, label: "Meu Perfil", href: "/imobiliaria/meu-perfil" },
    ],
    integrante_imobiliaria: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/imobiliaria" },
      { icon: ShoppingCart, label: "Contratar EF", href: "/imobiliaria/contratar" },
      {icon: Users, label: "Gestão de Clientes EF", href: "/imobiliaria/inquilinos" },
      {icon: Key, label: "Solicitações de Entrega", href: "/imobiliaria/solicitacoes" },
      {icon: FileText, label: "Módulo de Vistoria", href: "/imobiliaria/vistorias" },
      { icon: Shield, label: "Seguros e Garantias", href: "/imobiliaria/seguros" },
      { icon: User, label: "Meu Perfil", href: "/imobiliaria/meu-perfil" },
    ],
    inquilino: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/inquilino" },
      { icon: FileText, label: "Meu Contrato", href: "/inquilino/contrato" },
      { icon: Key, label: "Solicitar Entrega", href: "/inquilino/solicitacao" },
      { icon: MessageSquare, label: "Atendimento", href: "/inquilino/atendimento" },
      { icon: User, label: "Meu Perfil", href: "/inquilino/perfil" },
    ],
  };

  const activeRole = (profile?.role || role) as keyof typeof menuItems;
  const items = menuItems[activeRole] || [];
  const userName = profile?.full_name || "Usuário";

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">

      {/* Sidebar - Desktop Only */}
      <aside
        className={cn(
          "bg-card border-r border-border transition-all duration-300 z-30 hidden md:flex flex-col",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors hidden md:block"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="md:hidden flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
              <span className="font-bold text-foreground">Entrega Facilitada</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <CommandSearch />
            <NotificationBell />

            <Link
              to={['admin', 'admin_master', 'equipe_ef'].includes(activeRole) ? '/admin/perfil' : activeRole === 'inquilino' ? '/inquilino/perfil' : '/imobiliaria/meu-perfil'}
              className="flex items-center gap-3 pl-4 border-l border-border text-sm hover:opacity-80 transition-opacity"
            >
              <div className="text-right hidden sm:block">
                <p className="font-bold text-foreground truncate max-w-[150px]">{userName}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                  {activeRole === 'inquilino' ? 'Cliente EF' : activeRole === 'integrante_imobiliaria' ? 'Integrante' : activeRole.replace('_', ' ')}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold border border-secondary/20 shadow-inner">
                {userName.charAt(0).toUpperCase()}
              </div>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-2 hidden sm:flex"
              onClick={handleLogout}
              title="Sair da plataforma"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <div className={cn(
          "flex-1 overflow-y-auto p-6 md:p-10",
          "pb-24 md:pb-10"
        )}>
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>

        {/* Mobile Navigation Components */}
        <MobileBottomNav
          role={activeRole}
          onMenuOpen={() => setIsMobileMenuOpen(true)}
        />

        <MobileMenuDrawer
          open={isMobileMenuOpen}
          onOpenChange={setIsMobileMenuOpen}
          userName={userName}
          role={activeRole}
          items={items}
        />
      </main>
    </div>
  );
};

export default DashboardLayout;

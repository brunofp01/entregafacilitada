import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Plus, Menu, User, FileText, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  role: "admin" | "imobiliaria" | "inquilino" | "integrante_imobiliaria";
  onMenuOpen: () => void;
}

export const MobileBottomNav = ({ role, onMenuOpen }: MobileBottomNavProps) => {
  const location = useLocation();

  const navItems = {
    admin: [
      { icon: LayoutDashboard, label: "Home", href: "/admin" },
      { icon: Building2, label: "Imobs", href: "/admin/imobiliarias" },
      { icon: Users, label: "Users", href: "/admin/usuarios" },
    ],
    imobiliaria: [
      { icon: LayoutDashboard, label: "Home", href: "/imobiliaria" },
      { icon: Users, label: "Inquilinos", href: "/imobiliaria/inquilinos" },
      { icon: Plus, label: "Vistoria", href: "/imobiliaria/vistorias/nova" },
    ],
    integrante_imobiliaria: [
      { icon: LayoutDashboard, label: "Home", href: "/imobiliaria" },
      { icon: Users, label: "Inquilinos", href: "/imobiliaria/inquilinos" },
      { icon: Plus, label: "Vistoria", href: "/imobiliaria/vistorias/nova" },
    ],
    inquilino: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/inquilino" },
      { icon: FileText, label: "Contrato", href: "/inquilino/contrato" },
      { icon: CreditCard, label: "Pagamentos", href: "/inquilino/pagamentos" },
    ],
  };

  const items = navItems[role] || [];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2 z-50 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      {items.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
              isActive ? "text-secondary" : "text-muted-foreground"
            )}
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
          </Link>
        );
      })}

      <button
        onClick={onMenuOpen}
        className="flex flex-col items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
      >
        <Menu className="w-5 h-5 mb-1" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Menu</span>
      </button>
    </nav>
  );
};

// Importar ícone faltante Building2 no admin se necessário
import { Building2 } from "lucide-react";

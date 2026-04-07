import { useState, useEffect } from "react";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import logoIcon from "@/assets/logo-icon.png";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(localStorage.getItem('userRole'));
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setUserRole(null);
        localStorage.removeItem('userRole');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchRole = async () => {
      if (session?.user?.id && !userRole) {
        const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (data?.role) {
          setUserRole(data.role);
          localStorage.setItem('userRole', data.role);
        }
      }
    };
    fetchRole();
  }, [session, userRole]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    localStorage.removeItem('userRole');
    setOpen(false);
    navigate("/");
  };

  const getDashboardPath = () => {
    if (!userRole) return "/auth";
    if (userRole === "admin") return "/admin";
    if (userRole === "imobiliaria" || userRole === "integrante_imobiliaria") return "/imobiliaria";
    return "/inquilino";
  };

  const links = [
    { label: "Como funciona", href: "#como-funciona" },
    { label: "Simulador", href: "#simulador" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Entrega Facilitada" className="h-8 w-8" />
          <span className="font-heading font-bold text-lg text-foreground">
            Entrega <span className="text-secondary">Facilitada</span>
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}

          {session ? (
            <div className="flex items-center gap-3">
              <Link to={getDashboardPath()}>
                <Button size="sm" variant="outline" className="gap-2 font-bold border-secondary text-secondary hover:bg-secondary/10">
                  <LayoutDashboard className="w-4 h-4" />
                  Meu Painel
                </Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold">
                Acessar plataforma
              </Button>
            </Link>
          )}
        </div>

        <button className="md:hidden p-2 text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background p-4 space-y-3">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2">
              {l.label}
            </a>
          ))}

          {session ? (
            <div className="flex flex-col gap-2">
              <Link to={getDashboardPath()} onClick={() => setOpen(false)}>
                <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Ir para o Painel
                </Button>
              </Link>
              <Button variant="outline" onClick={handleLogout} className="w-full border-destructive text-destructive hover:bg-destructive/10 font-bold gap-2">
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </div>
          ) : (
            <Link to="/auth" onClick={() => setOpen(false)}>
              <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold">
                Acessar plataforma
              </Button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;

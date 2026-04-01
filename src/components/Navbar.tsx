import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoIcon from "@/assets/logo-icon.png";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  const links = [
    { label: "Como funciona", href: "#como-funciona" },
    { label: "Simulador", href: "#simulador" },
    { label: "Perfis", href: "#perfis" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container flex h-16 items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <img src={logoIcon} alt="Entrega Facilitada" className="h-8 w-8" />
          <span className="font-heading font-bold text-lg text-foreground">
            Entrega <span className="text-secondary">Facilitada</span>
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
          <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold">
            Acessar plataforma
          </Button>
        </div>

        <button className="md:hidden p-2 text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background p-4 space-y-3">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2">
              {l.label}
            </a>
          ))}
          <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold">
            Acessar plataforma
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

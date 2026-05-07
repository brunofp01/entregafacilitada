import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: "admin" | "imobiliaria" | "inquilino" | "integrante_imobiliaria" | "admin_master" | "equipe_ef" | Array<"admin" | "imobiliaria" | "inquilino" | "integrante_imobiliaria" | "admin_master" | "equipe_ef">;
}

const ProtectedRoute = ({ children, allowedRole }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          navigate("/auth");
          return;
        }

        const cachedRole = localStorage.getItem('userRole');
        let userRole = cachedRole;

        // If no cached role or explicitly requested (optional: add a check for role freshness)
        if (!userRole) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          userRole = profile?.role as string;

          if (userRole) {
            localStorage.setItem('userRole', userRole);
          }
        }

        if (allowedRole) {
          const allowed = Array.isArray(allowedRole)
            ? allowedRole.includes(userRole as any)
            : userRole === allowedRole;

          if (!allowed) {
            // Fallback dashboard mapping
            const dashboardMap: Record<string, string> = {
              admin_master: "/admin",
              admin: "/admin",
              equipe_ef: "/admin",
              imobiliaria: "/imobiliaria",
              integrante_imobiliaria: "/imobiliaria",
              inquilino: "/inquilino",
            };
            navigate(dashboardMap[userRole || ""] || "/");
            return;
          }
        }

        setAuthorized(true);
      } catch (error) {
        console.error("Erro na proteção de rota:", error);
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [allowedRole, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-secondary" />
      </div>
    );
  }

  return authorized ? <>{children}</> : null;
};

export default ProtectedRoute;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: "admin" | "imobiliaria" | "inquilino";
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

        if (allowedRole) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (profile?.role !== allowedRole) {
            // Redirect to their own dashboard if they share the wrong role
            const dashboardMap = {
              admin: "/admin",
              imobiliaria: "/imobiliaria",
              inquilino: "/inquilino",
            };
            navigate(dashboardMap[profile?.role as keyof typeof dashboardMap] || "/");
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

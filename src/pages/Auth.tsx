import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogIn, UserPlus, Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  const handleAuth = async (type: "login" | "signup") => {
    try {
      setLoading(true);
      const { error } = type === "login" 
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

      if (error) throw error;

      if (type === "signup") {
        toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não encontrado após login.");

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Erro ao buscar perfil:", profileError);
          // Fallback redirect or error
          toast.error("Erro ao carregar seu perfil. Verifique as permissões de banco.");
          return;
        }

        toast.success("Login realizado com sucesso!");
        
        if (profile?.role === "admin") {
          navigate("/admin");
        } else if (profile?.role === "imobiliaria") {
          navigate("/imobiliaria");
        } else {
          navigate("/inquilino");
        }
      }
    } catch (error: any) {
      console.error("Erro detalhado de autenticação:", error);
      toast.error(error.message || "Ocorreu um erro na autenticação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-8 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para a home
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">
            Entrega <span className="text-secondary">Facilitada</span>
          </h1>
          <p className="text-muted-foreground">Acesse sua conta para gerenciar suas entregas.</p>
        </div>

        <Card className="border-border/50 shadow-2xl backdrop-blur-sm bg-card/80">
          <Tabs defaultValue="login" className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground font-semibold">
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground font-semibold">
                  Cadastrar
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="mt-0">
                <CardTitle className="text-2xl font-bold">Bem-vindo de volta</CardTitle>
                <CardDescription>Insira suas credenciais para acessar a plataforma.</CardDescription>
              </TabsContent>
              
              <TabsContent value="signup" className="mt-0">
                <CardTitle className="text-2xl font-bold">Criar conta</CardTitle>
                <CardDescription>Comece hoje mesmo a facilitar suas entregas.</CardDescription>
              </TabsContent>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Senha</Label>
                  <Button variant="link" className="text-xs p-0 h-auto text-secondary hover:text-secondary/80">
                    Esqueceu a senha?
                  </Button>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/50"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <TabsContent value="login" className="mt-0 w-full">
                <Button 
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold text-lg h-12 shadow-lg shadow-secondary/20 transition-all hover:scale-[1.02]"
                  onClick={() => handleAuth("login")}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5 mr-2" />}
                  Entrar
                </Button>
              </TabsContent>
              
              <TabsContent value="signup" className="mt-0 w-full">
                <Button 
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold text-lg h-12 shadow-lg shadow-secondary/20 transition-all hover:scale-[1.02]"
                  onClick={() => handleAuth("signup")}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5 mr-2" />}
                  Cadastrar
                </Button>
              </TabsContent>
            
            <div className="relative w-full py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <Button variant="outline" className="border-border/50 hover:bg-secondary/5 transition-colors">
                Google
              </Button>
              <Button variant="outline" className="border-border/50 hover:bg-secondary/5 transition-colors">
                GitHub
              </Button>
            </div>
          </CardFooter>
        </Tabs>
      </Card>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Ao continuar, você concorda com nossos{" "}
          <a href="#" className="underline hover:text-foreground">Termos de Serviço</a> e{" "}
          <a href="#" className="underline hover:text-foreground">Política de Privacidade</a>.
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;

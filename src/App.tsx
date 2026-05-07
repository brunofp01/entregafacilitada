import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PwaHandler } from "./components/pwa/PwaHandler.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.tsx";
import { DashboardSkeleton } from "./components/dashboard/DashboardSkeleton";

// --- Lazy Pages ---
const Index = lazy(() => import("./pages/Index.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const PublicCheckoutPage = lazy(() => import("./pages/PublicCheckoutPage.tsx"));
const SuccessPage = lazy(() => import("./pages/SuccessPage.tsx"));

// Admin
const AdminDashboard = lazy(() => import("./pages/dashboard/AdminDashboard.tsx"));
const PricingParametersPage = lazy(() => import("./pages/dashboard/admin/PricingParametersPage.tsx"));
const ImobiliariasPage = lazy(() => import("./pages/dashboard/admin/ImobiliariasPage.tsx"));
const UsuariosPage = lazy(() => import("./pages/dashboard/admin/UsuariosPage.tsx"));
const RelatoriosPage = lazy(() => import("./pages/dashboard/admin/RelatoriosPage.tsx"));
const ConfiguracoesPage = lazy(() => import("./pages/dashboard/admin/ConfiguracoesPage.tsx"));
const AdminPerfilPage = lazy(() => import("./pages/dashboard/admin/PerfilPage.tsx"));
const PlanoGestaoPage = lazy(() => import("./pages/dashboard/admin/PlanoGestaoPage.tsx"));
const AprovacaoPage = lazy(() => import("./pages/dashboard/admin/AprovacaoPage.tsx"));
const ContratoPadraoPage = lazy(() => import("./pages/dashboard/admin/ContratoPadraoPage.tsx"));
const LeadsAdminPage = lazy(() => import("./pages/dashboard/admin/LeadsAdminPage.tsx"));
const NovaImobiliariaPage = lazy(() => import("./pages/dashboard/admin/NovaImobiliariaPage.tsx"));
const SolicitacoesPage = lazy(() => import("./pages/dashboard/imobiliaria/SolicitacoesPage.tsx"));

// Imobiliaria
const ImobiliariaDashboard = lazy(() => import("./pages/dashboard/ImobiliariaDashboard.tsx"));
const EquipePage = lazy(() => import("./pages/dashboard/imobiliaria/EquipePage.tsx"));
const VistoriasPage = lazy(() => import("./pages/dashboard/imobiliaria/VistoriasPage.tsx"));
const NewVistoria = lazy(() => import("./pages/dashboard/imobiliaria/NewVistoria.tsx"));
const PerfilPage = lazy(() => import("./pages/dashboard/imobiliaria/PerfilPage.tsx"));
const ContratacaoPage = lazy(() => import("./pages/dashboard/imobiliaria/ContratacaoPage.tsx"));
const InquilinosPage = lazy(() => import("./pages/dashboard/imobiliaria/InquilinosPage.tsx"));
const SegurosPage = lazy(() => import("./pages/dashboard/imobiliaria/SegurosPage.tsx"));
const MeuPerfilPage = lazy(() => import("./pages/dashboard/imobiliaria/MeuPerfilPage.tsx"));

// Inquilino
const InquilinoDashboard = lazy(() => import("./pages/dashboard/InquilinoDashboard.tsx"));
const PerfilInquilinoPage = lazy(() => import("./pages/dashboard/inquilino/PerfilInquilinoPage.tsx"));
const ContratoEFPage = lazy(() => import("./pages/dashboard/inquilino/ContratoEFPage.tsx"));
const SolicitacaoEntregaPage = lazy(() => import("./pages/dashboard/inquilino/SolicitacaoEntregaPage.tsx"));
const AtendimentoPage = lazy(() => import("./pages/dashboard/inquilino/AtendimentoPage.tsx"));
const PagamentoSucessoPage = lazy(() => import("./pages/dashboard/inquilino/PagamentoSucessoPage.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PwaHandler />
          <Suspense fallback={<div className="p-8"><DashboardSkeleton /></div>}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/contratar-publico" element={<PublicCheckoutPage />} />
              <Route path="/sucesso" element={<SuccessPage />} />

              {/* Dashboard Routes with Protection */}
              <Route path="/admin/*" element={
                <ProtectedRoute allowedRole={["admin", "admin_master", "equipe_ef"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/parametros" element={
                <ProtectedRoute allowedRole={["admin", "admin_master", "equipe_ef"]}>
                  <PricingParametersPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/imobiliarias" element={
                <ProtectedRoute allowedRole={["admin", "admin_master", "equipe_ef"]}>
                  <ImobiliariasPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/imobiliarias/nova" element={
                <ProtectedRoute allowedRole={["admin_master", "admin"]}>
                  <NovaImobiliariaPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/usuarios" element={
                <ProtectedRoute allowedRole={["admin", "admin_master", "equipe_ef"]}>
                  <UsuariosPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/relatorios" element={
                <ProtectedRoute allowedRole={["admin", "admin_master", "equipe_ef"]}>
                  <RelatoriosPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/configuracoes" element={
                <ProtectedRoute allowedRole={["admin", "admin_master", "equipe_ef"]}>
                  <ConfiguracoesPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/perfil" element={
                <ProtectedRoute allowedRole={["admin", "admin_master", "equipe_ef"]}>
                  <AdminPerfilPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/planos" element={
                <ProtectedRoute allowedRole={["admin", "admin_master", "equipe_ef"]}>
                  <PlanoGestaoPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/aprovacoes" element={
                <ProtectedRoute allowedRole={["admin", "admin_master", "equipe_ef"]}>
                  <AprovacaoPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/contrato-padrao" element={
                <ProtectedRoute allowedRole={["admin", "admin_master", "equipe_ef"]}>
                  <ContratoPadraoPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/leads" element={
                <ProtectedRoute allowedRole={["admin", "admin_master", "equipe_ef"]}>
                  <LeadsAdminPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/solicitacoes" element={
                <ProtectedRoute allowedRole={["admin", "admin_master", "equipe_ef"]}>
                  <SolicitacoesPage />
                </ProtectedRoute>
              } />

              <Route path="/imobiliaria/vistorias" element={
                <ProtectedRoute allowedRole={["imobiliaria", "integrante_imobiliaria"]}>
                  <VistoriasPage />
                </ProtectedRoute>
              } />
              <Route path="/imobiliaria/vistorias/nova" element={
                <ProtectedRoute allowedRole={["imobiliaria", "integrante_imobiliaria", "admin"]}>
                  <NewVistoria />
                </ProtectedRoute>
              } />
              <Route path="/imobiliaria/contratar" element={
                <ProtectedRoute allowedRole={["imobiliaria", "integrante_imobiliaria", "admin", "admin_master", "equipe_ef"]}>
                  <ContratacaoPage />
                </ProtectedRoute>
              } />
              <Route path="/imobiliaria/inquilinos" element={
                <ProtectedRoute allowedRole={["imobiliaria", "integrante_imobiliaria"]}>
                  <InquilinosPage />
                </ProtectedRoute>
              } />
              <Route path="/imobiliaria/seguros" element={
                <ProtectedRoute allowedRole={["imobiliaria", "integrante_imobiliaria"]}>
                  <SegurosPage />
                </ProtectedRoute>
              } />
              <Route path="/imobiliaria/solicitacoes" element={
                <ProtectedRoute allowedRole={["imobiliaria", "integrante_imobiliaria"]}>
                  <SolicitacoesPage />
                </ProtectedRoute>
              } />

              <Route path="/imobiliaria/perfil" element={
                <ProtectedRoute allowedRole="imobiliaria">
                  <PerfilPage />
                </ProtectedRoute>
              } />

              <Route path="/imobiliaria/meu-perfil" element={
                <ProtectedRoute allowedRole={["imobiliaria", "integrante_imobiliaria"]}>
                  <MeuPerfilPage />
                </ProtectedRoute>
              } />

              <Route path="/imobiliaria/equipe" element={
                <ProtectedRoute allowedRole="imobiliaria">
                  <EquipePage />
                </ProtectedRoute>
              } />

              <Route path="/imobiliaria/*" element={
                <ProtectedRoute allowedRole={["imobiliaria", "integrante_imobiliaria"]}>
                  <ImobiliariaDashboard />
                </ProtectedRoute>
              } />


              <Route path="/inquilino/perfil" element={
                <ProtectedRoute allowedRole="inquilino">
                  <PerfilInquilinoPage />
                </ProtectedRoute>
              } />

              <Route path="/inquilino/contrato" element={
                <ProtectedRoute allowedRole="inquilino">
                  <ContratoEFPage />
                </ProtectedRoute>
              } />


              <Route path="/inquilino/contratar" element={
                <ProtectedRoute allowedRole={["inquilino", "admin", "imobiliaria", "integrante_imobiliaria"]}>
                  <ContratacaoPage />
                </ProtectedRoute>
              } />

              <Route path="/inquilino/pagamento-sucesso" element={
                <ProtectedRoute allowedRole="inquilino">
                  <PagamentoSucessoPage />
                </ProtectedRoute>
              } />

              <Route path="/inquilino/solicitacao" element={
                <ProtectedRoute allowedRole="inquilino">
                  <SolicitacaoEntregaPage />
                </ProtectedRoute>
              } />

              <Route path="/inquilino/atendimento" element={
                <ProtectedRoute allowedRole="inquilino">
                  <AtendimentoPage />
                </ProtectedRoute>
              } />

              <Route path="/inquilino/*" element={
                <ProtectedRoute allowedRole="inquilino">
                  <InquilinoDashboard />
                </ProtectedRoute>
              } />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import AdminDashboard from "./pages/dashboard/AdminDashboard.tsx";
import PricingParametersPage from "./pages/dashboard/admin/PricingParametersPage.tsx";
import ImobiliariasPage from "./pages/dashboard/admin/ImobiliariasPage.tsx";
import UsuariosPage from "./pages/dashboard/admin/UsuariosPage.tsx";
import RelatoriosPage from "./pages/dashboard/admin/RelatoriosPage.tsx";
import ConfiguracoesPage from "./pages/dashboard/admin/ConfiguracoesPage.tsx";
import AdminPerfilPage from "./pages/dashboard/admin/PerfilPage.tsx";
import PlanoGestaoPage from "./pages/dashboard/admin/PlanoGestaoPage.tsx";
import AprovacaoPage from "./pages/dashboard/admin/AprovacaoPage.tsx";
import ImobiliariaDashboard from "./pages/dashboard/ImobiliariaDashboard.tsx";
import EquipePage from "./pages/dashboard/imobiliaria/EquipePage.tsx";
import VistoriasPage from "./pages/dashboard/imobiliaria/VistoriasPage.tsx";
import NewVistoria from "./pages/dashboard/imobiliaria/NewVistoria.tsx";
import PerfilPage from "./pages/dashboard/imobiliaria/PerfilPage.tsx";
import ContratacaoPage from "./pages/dashboard/imobiliaria/ContratacaoPage.tsx";
import InquilinosPage from "./pages/dashboard/imobiliaria/InquilinosPage.tsx";
import SegurosPage from "./pages/dashboard/imobiliaria/SegurosPage.tsx";
import MeuPerfilPage from "./pages/dashboard/imobiliaria/MeuPerfilPage.tsx";
import InquilinoDashboard from "./pages/dashboard/InquilinoDashboard.tsx";
import PerfilInquilinoPage from "./pages/dashboard/inquilino/PerfilInquilinoPage.tsx";
import ContratoEFPage from "./pages/dashboard/inquilino/ContratoEFPage.tsx";
import PagamentosPage from "./pages/dashboard/inquilino/PagamentosPage.tsx";
import SolicitacaoEntregaPage from "./pages/dashboard/inquilino/SolicitacaoEntregaPage.tsx";
import AtendimentoPage from "./pages/dashboard/inquilino/AtendimentoPage.tsx";
import PagamentoSucessoPage from "./pages/dashboard/inquilino/PagamentoSucessoPage.tsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.tsx";
import NotFound from "./pages/NotFound.tsx";

import { PwaHandler } from "./components/pwa/PwaHandler.tsx";

// Deploy Force Sync: 2026-04-02 13:53
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PwaHandler />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />

          {/* Dashboard Routes with Protection */}
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/parametros" element={
            <ProtectedRoute allowedRole="admin">
              <PricingParametersPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/imobiliarias" element={
            <ProtectedRoute allowedRole="admin">
              <ImobiliariasPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/usuarios" element={
            <ProtectedRoute allowedRole="admin">
              <UsuariosPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/relatorios" element={
            <ProtectedRoute allowedRole="admin">
              <RelatoriosPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/configuracoes" element={
            <ProtectedRoute allowedRole="admin">
              <ConfiguracoesPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/perfil" element={
            <ProtectedRoute allowedRole="admin">
              <AdminPerfilPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/planos" element={
            <ProtectedRoute allowedRole="admin">
              <PlanoGestaoPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/aprovacoes" element={
            <ProtectedRoute allowedRole="admin">
              <AprovacaoPage />
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
            <ProtectedRoute allowedRole={["imobiliaria", "integrante_imobiliaria"]}>
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

          <Route path="/inquilino/pagamentos" element={
            <ProtectedRoute allowedRole="inquilino">
              <PagamentosPage />
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

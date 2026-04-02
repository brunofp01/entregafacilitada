import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import AdminDashboard from "./pages/dashboard/AdminDashboard.tsx";
import ImobiliariaDashboard from "./pages/dashboard/ImobiliariaDashboard.tsx";
import EquipePage from "./pages/dashboard/imobiliaria/EquipePage.tsx";
import VistoriasPage from "./pages/dashboard/imobiliaria/VistoriasPage.tsx";
import NewVistoria from "./pages/dashboard/imobiliaria/NewVistoria.tsx";
import PerfilPage from "./pages/dashboard/imobiliaria/PerfilPage.tsx";
import ContratacaoPage from "./pages/dashboard/imobiliaria/ContratacaoPage.tsx";
import InquilinoDashboard from "./pages/dashboard/InquilinoDashboard.tsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.tsx";
import NotFound from "./pages/NotFound.tsx";

import { PwaHandler } from "./components/pwa/PwaHandler.tsx";

// Deploy Force Sync: 2026-04-01 19:33
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

          <Route path="/imobiliaria/*" element={
            <ProtectedRoute allowedRole={["imobiliaria", "integrante_imobiliaria"]}>
              <ImobiliariaDashboard />
            </ProtectedRoute>
          } />
          <Route path="/imobiliaria/equipe" element={
            <ProtectedRoute allowedRole="imobiliaria">
              <EquipePage />
            </ProtectedRoute>
          } />
          <Route path="/imobiliaria/vistorias" element={
            <ProtectedRoute allowedRole={["imobiliaria", "integrante_imobiliaria"]}>
              <VistoriasPage />
            </ProtectedRoute>
          } />
          <Route path="/imobiliaria/vistorias/nova" element={
            <ProtectedRoute allowedRole={["imobiliaria", "integrante_imobiliaria"]}>
              <NewVistoria />
            </ProtectedRoute>
          } />
          <Route path="/imobiliaria/contratar" element={
            <ProtectedRoute allowedRole={["imobiliaria", "integrante_imobiliaria"]}>
              <ContratacaoPage />
            </ProtectedRoute>
          } />

          <Route path="/imobiliaria/perfil" element={
            <ProtectedRoute allowedRole="imobiliaria">
              <PerfilPage />
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

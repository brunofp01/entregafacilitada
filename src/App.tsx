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
import InquilinoDashboard from "./pages/dashboard/InquilinoDashboard.tsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
            <ProtectedRoute allowedRole="imobiliaria">
              <ImobiliariaDashboard />
            </ProtectedRoute>
          } />
          <Route path="/imobiliaria/equipe" element={
            <ProtectedRoute allowedRole="imobiliaria">
              <EquipePage />
            </ProtectedRoute>
          } />
          <Route path="/imobiliaria/vistorias" element={
            <ProtectedRoute allowedRole="imobiliaria">
              <VistoriasPage />
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

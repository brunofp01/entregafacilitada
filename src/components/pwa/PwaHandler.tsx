import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const PwaHandler = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Verificar se já está rodando como App instalado
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      const allowedRoutes = ['/auth', '/imobiliaria', '/admin', '/inquilino'];
      const isAllowed = allowedRoutes.some(route => location.pathname.startsWith(route));

      // Regra: Somente mostrar se NÃO for a Landing Page (/) e NÃO estiver instalado
      if (isAllowed && !checkStandalone) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [location.pathname]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowBanner(false);
    }
  };

  // Se já estiver instalado, na home, ou sem prompt disponível, não renderiza nada
  if (isStandalone || location.pathname === '/' || !showBanner) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 bg-card border border-border shadow-2xl rounded-2xl p-4 z-[100] flex flex-col gap-3"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-secondary-foreground font-bold shrink-0">
              EF
            </div>
            <div>
              <h3 className="font-bold text-sm">Instalar App</h3>
              <p className="text-xs text-muted-foreground line-clamp-1">Acesse a plataforma mais rápido.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowBanner(false)}
            className="p-1 hover:bg-muted rounded-full text-muted-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <Button onClick={handleInstall} className="w-full bg-secondary text-secondary-foreground font-bold gap-2">
          <Download className="w-4 h-4" />
          Adicionar à Tela de Início
        </Button>
      </motion.div>
    </AnimatePresence>
  );
};

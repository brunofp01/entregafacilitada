import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';
import ErrorBoundary from "./components/ErrorBoundary";

// Registrar o Service Worker para suporte PWA
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
);

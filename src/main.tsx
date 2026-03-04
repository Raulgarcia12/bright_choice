import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { initGA } from "./lib/analytics";

// Initialize Google Analytics (no-op if VITE_GA_MEASUREMENT_ID is not set)
initGA();

createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
);

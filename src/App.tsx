import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatbotWidget from "./components/ChatbotWidget";

/* ── Lazy-loaded pages (code-split by route) ── */
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Index = lazy(() => import("./pages/Index"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const ChangeLog = lazy(() => import("./pages/ChangeLog"));
const LoginPage = lazy(() => import("./pages/Login"));
const AdminPage = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SetupPage = lazy(() => import("./pages/Setup"));
const WelcomePage = lazy(() => import("./pages/Welcome"));

const queryClient = new QueryClient();

/* ── Minimal loading spinner ── */
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/products" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/changes" element={<ProtectedRoute minRole="analyst"><ChangeLog /></ProtectedRoute>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/admin" element={<ProtectedRoute minRole="admin"><AdminPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <ChatbotWidget />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

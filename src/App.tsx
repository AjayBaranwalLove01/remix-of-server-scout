import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "./store/authStore";
import AppLayout from "./components/AppLayout";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Locations from "./pages/Locations.tsx";
import OsCatalog from "./pages/OsCatalog.tsx";
import Placeholder from "./pages/Placeholder.tsx";
import LoginPage from "./pages/Login.tsx";

const queryClient = new QueryClient();

function ProtectedRoute() {
  const { token, initialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/inventory" element={<Index />} />
              <Route path="/locations" element={<Locations />} />
              <Route path="/os" element={<OsCatalog />} />
              <Route path="/monitoring" element={<Placeholder title="Monitoring" />} />
              <Route path="/servers" element={<Placeholder title="Servers" />} />
              <Route path="/reports" element={<Placeholder title="Reports" />} />
              <Route path="/alerts" element={<Placeholder title="Alerts" />} />
              <Route path="/settings" element={<Placeholder title="Settings" />} />
              <Route path="/users" element={<Placeholder title="Users" />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

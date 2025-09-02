import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from './contexts/AuthContext';
import { Web3Provider } from './contexts/Web3Context';
import Chatbot from './components/Chatbot';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Upload from "./pages/Upload";
import Dashboard from "./pages/Dashboard";
import Verify from "./pages/Verify";
import NotFound from "./pages/NotFound";
import DocumentView from './pages/DocumentView';
import { DocumentProvider } from './lib/utils.tsx';
import SignIn from './pages/SignIn';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
    <AuthProvider>
    <Web3Provider>
    <Toaster />
    <Sonner />
    <Chatbot />
      <DocumentProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/upload" element={
              <ProtectedRoute>
                <Upload />
              </ProtectedRoute>
            } />
            <Route path="/verify" element={
              <ProtectedRoute>
                <Verify />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/document/:id" element={
              <ProtectedRoute>
                <DocumentView />
              </ProtectedRoute>
            } />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </DocumentProvider>
    </Web3Provider>
    </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

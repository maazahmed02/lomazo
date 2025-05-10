import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import InsuranceCard from "./pages/InsuranceCard";
import LifestyleQuestions from "./pages/LifestyleQuestions.jsx";
import MedicalHistory from "./pages/MedicalHistory";
import DocumentUpload from "./pages/DocumentUpload";
import Completion from "./pages/Completion";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/insurance-card" element={<InsuranceCard />} />
          <Route path="/lifestyle-questions" element={<LifestyleQuestions />} />
          <Route path="/medical-history" element={<MedicalHistory />} />
          <Route path="/document-upload" element={<DocumentUpload />} />
          <Route path="/completion" element={<Completion />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

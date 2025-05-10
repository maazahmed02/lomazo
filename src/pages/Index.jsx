import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  return (
    <div className="min-h-screen flex flex-col bg-background p-6">
      <header className="text-center mb-8 mt-10">
        <h1 className="text-3xl font-bold mb-4">Willkommen zur Voranmeldung</h1>
        <p className="text-muted-foreground">
          Bitte füllen Sie den folgenden Check-in aus, um Ihren Arztbesuch zu beschleunigen
        </p>
      </header>

      <Card className="bg-teal-50 border-0 mb-8">
        <CardContent className="p-6">
          <div className="flex justify-center mb-6">
            {/* Placeholder for clinic logo/illustration */}
            <div className="w-32 h-32 bg-teal-100 rounded-full flex items-center justify-center">
              <span className="text-teal-700 text-2xl font-bold">Klinik</span>
            </div>
          </div>
          
          <h2 className="text-xl font-bold mb-4 text-center">So funktioniert's</h2>
          <ul className="space-y-4">
            <li className="flex items-start">
              <span className="mr-2 font-bold">1.</span>
              <span>Fotografieren Sie Ihre Versicherungskarte</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">2.</span>
              <span>Beantworten Sie einige Fragen zu Ihrem Lebensstil</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">3.</span>
              <span>Teilen Sie Ihre medizinische Vorgeschichte mit</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">4.</span>
              <span>Laden Sie relevante medizinische Dokumente hoch</span>
            </li>
          </ul>
        </CardContent>
      </Card>
      
      <div className="text-center my-4">
        <p className="text-muted-foreground">Gesamtdauer ca. 5 Minuten</p>
      </div>

      <div className="mt-auto">
        <Button 
          className="w-full py-6 text-lg bg-teal-700 hover:bg-teal-800 rounded-full"
          onClick={() => navigate('/insurance-card')}
        >
          Check-in starten
        </Button>
      </div>
    </div>
  );
};

export default Index;
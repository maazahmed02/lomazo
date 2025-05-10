import React from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Completion = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col bg-background p-6">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <Check className="h-10 w-10 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Vielen Dank!</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Ihre Voranmeldung wurde erfolgreich abgeschlossen. Wir freuen uns auf Ihren Besuch in unserer Praxis.
        </p>
        
        <Card className="bg-teal-50 border-0 mb-8 w-full max-w-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Was als nächstes passiert</h2>
            <ul className="text-left space-y-3">
              <li className="flex items-start">
                <span className="mr-2 font-bold">1.</span>
                <span>Ihre Informationen werden an unser Praxisteam weitergeleitet</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-bold">2.</span>
                <span>Bei Ihrem Termin wird deutlich weniger Papierkram notwendig sein</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-bold">3.</span>
                <span>Ihr Arzt ist bereits über Ihre Situation informiert</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <Button 
          className="w-full py-6 text-lg bg-teal-700 hover:bg-teal-800 rounded-full"
          onClick={() => navigate('/')}
        >
          Zum Start zurückkehren
        </Button>
      </div>
    </div>
  );
};

export default Completion;
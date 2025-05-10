import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Upload, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const InsuranceCard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cardImages, setCardImages] = useState({});
  const [captureOpen, setCaptureOpen] = useState(null);
  
  const handleCapture = (side) => {
    setCaptureOpen(side);
  };

  const handleFileChange = (event, side) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        setCardImages(prev => ({ ...prev, [side]: result }));
        toast({
          title: "Bild hochgeladen",
          description: side === "front" ? "Vorderseite erfolgreich hinzugefügt" : "Rückseite erfolgreich hinzugefügt",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateCameraCapture = (side) => {
    // In a real app, this would access the device camera
    // For this demo, we'll use placeholder images
    const mockImageUrl = side === "front" 
      ? "https://via.placeholder.com/400x250?text=Insurance+Card+Front" 
      : "https://via.placeholder.com/400x250?text=Insurance+Card+Back";
      
    setCardImages(prev => ({ ...prev, [side]: mockImageUrl }));
    setCaptureOpen(null);
    
    toast({
      title: "Bild aufgenommen",
      description: side === "front" ? "Vorderseite erfolgreich hinzugefügt" : "Rückseite erfolgreich hinzugefügt",
    });
  };

  const handleNext = () => {
    if (cardImages.front && cardImages.back) {
      navigate('/lifestyle-questions');
    } else {
      toast({
        title: "Fehlende Bilder",
        description: "Bitte fotografieren Sie beide Seiten der Versicherungskarte",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background p-6">
      <header className="mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-foreground"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        
        <h1 className="text-3xl font-bold mt-6 mb-2">Versicherungskarte</h1>
        <p className="text-muted-foreground">
          Bitte fotografieren Sie Ihre Versicherungskarte von beiden Seiten
        </p>
      </header>

      <div className="flex flex-col gap-6 mb-8">
        {/* Front of card */}
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Vorderseite</h2>
            {cardImages.front ? (
              <div className="relative">
                <img 
                  src={cardImages.front} 
                  alt="Vorderseite der Versicherungskarte" 
                  className="w-full h-48 object-contain border rounded-md"
                />
                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                  <Check className="h-5 w-5" />
                </div>
                <Button 
                  variant="outline" 
                  className="mt-3 w-full"
                  onClick={() => handleCapture("front")}
                >
                  Neu aufnehmen
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Button 
                  className="flex items-center justify-center gap-2 py-6"
                  onClick={() => handleCapture("front")}
                >
                  <Camera /> Foto aufnehmen
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    id="front-upload"
                    onChange={(e) => handleFileChange(e, "front")}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Upload /> Bild hochladen
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back of card */}
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Rückseite</h2>
            {cardImages.back ? (
              <div className="relative">
                <img 
                  src={cardImages.back} 
                  alt="Rückseite der Versicherungskarte" 
                  className="w-full h-48 object-contain border rounded-md"
                />
                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                  <Check className="h-5 w-5" />
                </div>
                <Button 
                  variant="outline" 
                  className="mt-3 w-full"
                  onClick={() => handleCapture("back")}
                >
                  Neu aufnehmen
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Button 
                  className="flex items-center justify-center gap-2 py-6"
                  onClick={() => handleCapture("back")}
                >
                  <Camera /> Foto aufnehmen
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    id="back-upload"
                    onChange={(e) => handleFileChange(e, "back")}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Upload /> Bild hochladen
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Continue button */}
      <div className="mt-auto">
        <Button 
          className="w-full py-6 text-lg bg-teal-700 hover:bg-teal-800 rounded-full"
          onClick={handleNext}
        >
          Weiter
        </Button>
      </div>

      {/* Camera capture dialog */}
      <Dialog open={captureOpen !== null} onOpenChange={() => setCaptureOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Foto aufnehmen
              {captureOpen === "front" ? " (Vorderseite)" : " (Rückseite)"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6">
            <div className="bg-gray-100 w-full h-64 rounded-lg flex items-center justify-center mb-4">
              <Camera className="h-12 w-12 text-gray-400" />
            </div>
            <Button 
              className="w-full"
              onClick={() => captureOpen && simulateCameraCapture(captureOpen)}
            >
              Foto aufnehmen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InsuranceCard;
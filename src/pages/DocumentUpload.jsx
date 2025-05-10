import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Upload, File, X, Check, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

const DocumentUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [currentDocumentType, setCurrentDocumentType] = useState("");
  
  const documentTypes = [
    { id: "lab-results", name: "Laborbefunde" },
    { id: "vaccination", name: "Impfpass" },
    { id: "previous-diagnosis", name: "Frühere Diagnosen" },
    { id: "medication", name: "Aktuelle Medikation" },
    { id: "other", name: "Sonstige Dokumente" }
  ];
  
  const handleCapture = (documentType) => {
    setCurrentDocumentType(documentType);
    setCaptureOpen(true);
  };

  const handleFileChange = (event, documentType) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        const newDoc = {
          id: `doc-${Date.now()}`,
          name: file.name,
          type: documentType,
          preview: result
        };
        setDocuments(prev => [...prev, newDoc]);
        toast({
          title: "Dokument hochgeladen",
          description: `${file.name} wurde erfolgreich hinzugefügt`,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateCameraCapture = () => {
    // In a real app, this would access the device camera
    // For this demo, we'll use placeholder images
    const documentTypeName = documentTypes.find(dt => dt.id === currentDocumentType)?.name || "Dokument";
    const mockImageUrl = `https://via.placeholder.com/400x500?text=${documentTypeName}`;
    const newDoc = {
      id: `doc-${Date.now()}`,
      name: `${documentTypeName} ${documents.length + 1}`,
      type: currentDocumentType,
      preview: mockImageUrl
    };
    
    setDocuments(prev => [...prev, newDoc]);
    setCaptureOpen(false);
    
    toast({
      title: "Dokument aufgenommen",
      description: `${newDoc.name} wurde erfolgreich hinzugefügt`,
    });
  };
  
  const removeDocument = (id) => {
    setDocuments(documents.filter(doc => doc.id !== id));
    toast({
      title: "Dokument entfernt",
      description: "Das Dokument wurde erfolgreich entfernt",
    });
  };

  const handleSubmit = () => {
    if (documents.length === 0) {
      toast({
        title: "Keine Dokumente",
        description: "Bitte laden Sie mindestens ein Dokument hoch oder fahren Sie fort",
        variant: "destructive"
      });
      return;
    }

    // Here you would typically send the documents to your backend
    toast({
      title: "Einreichung erfolgreich",
      description: `${documents.length} Dokumente wurden erfolgreich eingereicht`,
    });
    
    navigate('/completion');
  };

  const handleSkip = () => {
    navigate('/completion');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background p-6 pb-20">
      <header className="mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-foreground"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        
        <h1 className="text-3xl font-bold mt-6 mb-2">Dokumente hochladen</h1>
        <p className="text-muted-foreground">
          Bitte laden Sie relevante medizinische Dokumente hoch (optional)
        </p>
      </header>

      {/* Document type cards */}
      <div className="space-y-6 mb-6">
        {documentTypes.map((docType) => (
          <Card key={docType.id} className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <File className="text-teal-700 h-6 w-6" />
                  <h2 className="text-lg font-medium">{docType.name}</h2>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1"
                    onClick={() => handleCapture(docType.id)}
                  >
                    <Camera className="h-4 w-4" /> Foto
                  </Button>
                  
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      id={`upload-${docType.id}`}
                      onChange={(e) => handleFileChange(e, docType.id)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Upload className="h-4 w-4" /> Datei
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Document previews for this type */}
              {documents.filter(doc => doc.type === docType.id).length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {documents
                    .filter(doc => doc.type === docType.id)
                    .map((doc) => (
                      <div key={doc.id} className="relative">
                        <div className="relative aspect-[3/4] rounded border overflow-hidden">
                          {doc.preview.includes("pdf") ? (
                            <div className="h-full flex items-center justify-center bg-gray-100">
                              <File className="h-12 w-12 text-gray-400" />
                            </div>
                          ) : (
                            <img
                              className="h-full w-full object-cover"
                              src={doc.preview}
                              alt={doc.name}
                            />
                          )}
                          <button 
                            className="absolute top-1 right-1 bg-red-500 rounded-full p-1 text-white"
                            onClick={() => removeDocument(doc.id)}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs mt-1 truncate">{doc.name}</p>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Camera capture dialog */}
      <Dialog open={captureOpen} onOpenChange={setCaptureOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Foto aufnehmen
              {currentDocumentType && ` (${documentTypes.find(dt => dt.id === currentDocumentType)?.name})`}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6">
            <div className="bg-gray-100 w-full h-64 rounded-lg flex items-center justify-center mb-4">
              <Camera className="h-12 w-12 text-gray-400" />
            </div>
            <Button 
              className="w-full"
              onClick={simulateCameraCapture}
            >
              Foto aufnehmen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fixed continue buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-background border-t">
        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline"
            className="py-6 text-lg rounded-full"
            onClick={handleSkip}
          >
            Überspringen
          </Button>
          <Button 
            className="py-6 text-lg bg-teal-700 hover:bg-teal-800 rounded-full"
            onClick={handleSubmit}
          >
            Einreichen
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
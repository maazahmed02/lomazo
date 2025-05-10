import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const LifestyleQuestions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [answers, setAnswers] = useState({});
  
  const questions = [
    {
      id: "exercise",
      question: "Wie oft treiben Sie Sport?",
      type: "radio",
      options: [
        { id: "daily", label: "Täglich" },
        { id: "often", label: "3-5 mal pro Woche" },
        { id: "sometimes", label: "1-2 mal pro Woche" },
        { id: "rarely", label: "Selten" },
        { id: "never", label: "Nie" }
      ]
    },
    {
      id: "sleep",
      question: "Wie viele Stunden schlafen Sie pro Nacht im Durchschnitt?",
      type: "radio",
      options: [
        { id: "less-than-5", label: "Weniger als 5 Stunden" },
        { id: "5-6", label: "5-6 Stunden" },
        { id: "7-8", label: "7-8 Stunden" },
        { id: "more-than-8", label: "Mehr als 8 Stunden" }
      ]
    },
    {
      id: "diet",
      question: "Welche Ernährungsweise verfolgen Sie?",
      type: "radio",
      options: [
        { id: "omnivore", label: "Gemischt (Fleisch, Fisch, Gemüse)" },
        { id: "vegetarian", label: "Vegetarisch" },
        { id: "vegan", label: "Vegan" },
        { id: "pescatarian", label: "Pescetarisch (Fisch, kein Fleisch)" },
        { id: "other", label: "Andere" }
      ]
    },
    {
      id: "alcohol",
      question: "Wie häufig konsumieren Sie Alkohol?",
      type: "radio",
      options: [
        { id: "daily", label: "Täglich" },
        { id: "weekly", label: "Mehrmals pro Woche" },
        { id: "occasionally", label: "Gelegentlich" },
        { id: "never", label: "Nie" }
      ]
    },
    {
      id: "smoking",
      question: "Rauchen Sie?",
      type: "radio",
      options: [
        { id: "yes", label: "Ja, regelmäßig" },
        { id: "occasionally", label: "Ja, gelegentlich" },
        { id: "former", label: "Ehemaliger Raucher" },
        { id: "never", label: "Nein, nie geraucht" }
      ]
    },
    {
      id: "stress",
      question: "Wie schätzen Sie Ihr Stresslevel im Alltag ein?",
      type: "radio",
      options: [
        { id: "very-high", label: "Sehr hoch" },
        { id: "high", label: "Hoch" },
        { id: "medium", label: "Mittel" },
        { id: "low", label: "Niedrig" },
        { id: "very-low", label: "Sehr niedrig" }
      ]
    },
  ];

  const handleRadioChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };
  
  const handleCheckboxChange = (questionId, optionId, checked) => {
    setAnswers((prev) => {
      const current = (prev[questionId] || []);
      if (checked) {
        return { ...prev, [questionId]: [...current, optionId] };
      } else {
        return { ...prev, [questionId]: current.filter(id => id !== optionId) };
      }
    });
  };

  const handleNext = () => {
    // Check if all questions are answered
    const answeredQuestions = Object.keys(answers);
    if (answeredQuestions.length < questions.length) {
      toast({
        title: "Unvollständige Antworten",
        description: "Bitte beantworten Sie alle Fragen",
        variant: "destructive"
      });
      return;
    }

    navigate('/medical-history');
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
        
        <h1 className="text-3xl font-bold mt-6 mb-2">Lebensstil</h1>
        <p className="text-muted-foreground">
          Bitte beantworten Sie die folgenden Fragen zu Ihrem Lebensstil
        </p>
      </header>

      <div className="space-y-8 pb-20">
        {questions.map((q) => (
          <div key={q.id} className="border rounded-lg p-6 bg-white shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <HelpCircle className="text-teal-700 h-6 w-6 mt-0.5" />
              <h2 className="text-lg font-medium">{q.question}</h2>
            </div>
            
            {q.type === "radio" && (
              <RadioGroup 
                value={answers[q.id]} 
                onValueChange={(value) => handleRadioChange(q.id, value)}
                className="ml-9 space-y-3"
              >
                {q.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={`${q.id}-${option.id}`} />
                    <Label htmlFor={`${q.id}-${option.id}`}>{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}
            
            {q.type === "checkbox" && (
              <div className="ml-9 space-y-3">
                {q.options.map((option) => {
                  const checked = Array.isArray(answers[q.id]) 
                    ? answers[q.id].includes(option.id) 
                    : false;
                    
                  return (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`${q.id}-${option.id}`} 
                        checked={checked}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange(q.id, option.id, checked === true)
                        }
                      />
                      <Label htmlFor={`${q.id}-${option.id}`}>{option.label}</Label>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Fixed continue button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-background border-t">
        <Button 
          className="w-full py-6 text-lg bg-teal-700 hover:bg-teal-800 rounded-full"
          onClick={handleNext}
        >
          Weiter
        </Button>
      </div>
    </div>
  );
};

export default LifestyleQuestions;

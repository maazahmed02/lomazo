import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const MedicalHistory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [answers, setAnswers] = useState({});
  
  // Define medical history questions
  const personalQuestions = [
    {
      id: "chronic-conditions",
      question: "Haben Sie chronische Erkrankungen?",
      type: "checkbox",
      options: [
        { id: "diabetes", label: "Diabetes" },
        { id: "hypertension", label: "Bluthochdruck" },
        { id: "heart-disease", label: "Herzerkrankungen" },
        { id: "asthma", label: "Asthma" },
        { id: "arthritis", label: "Arthritis" },
        { id: "none", label: "Keine" }
      ]
    },
    {
      id: "allergies",
      question: "Haben Sie Allergien?",
      type: "radio",
      options: [
        { id: "yes", label: "Ja" },
        { id: "no", label: "Nein" }
      ]
    },
    {
      id: "allergies-details",
      question: "Wenn ja, welche Allergien haben Sie?",
      type: "textarea"
    },
    {
      id: "surgeries",
      question: "Wurden Sie schon einmal operiert?",
      type: "radio",
      options: [
        { id: "yes", label: "Ja" },
        { id: "no", label: "Nein" }
      ]
    },
    {
      id: "surgeries-details",
      question: "Wenn ja, welche Operationen und wann?",
      type: "textarea"
    }
  ];
  
  // Define family history questions
  const familyQuestions = [
    {
      id: "family-diabetes",
      question: "Gibt es Diabetes in Ihrer Familie?",
      type: "radio",
      options: [
        { id: "yes", label: "Ja" },
        { id: "no", label: "Nein" },
        { id: "unknown", label: "Weiß nicht" }
      ]
    },
    {
      id: "family-heart-disease",
      question: "Gibt es Herzerkrankungen in Ihrer Familie?",
      type: "radio",
      options: [
        { id: "yes", label: "Ja" },
        { id: "no", label: "Nein" },
        { id: "unknown", label: "Weiß nicht" }
      ]
    },
    {
      id: "family-cancer",
      question: "Gibt es Krebserkrankungen in Ihrer Familie?",
      type: "radio",
      options: [
        { id: "yes", label: "Ja" },
        { id: "no", label: "Nein" },
        { id: "unknown", label: "Weiß nicht" }
      ]
    },
    {
      id: "family-other",
      question: "Gibt es andere relevante Erkrankungen in Ihrer Familie?",
      type: "textarea"
    }
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
  
  const handleTextareaChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    navigate('/document-upload');
  };

  const renderQuestion = (q) => {
    // Skip textarea questions if they depend on a "yes" answer and the answer is not "yes"
    if (q.type === "textarea" && q.id.includes("details")) {
      const parentQuestionId = q.id.split("-details")[0];
      if (answers[parentQuestionId] !== "yes") {
        return null;
      }
    }

    return (
      <div key={q.id} className="border rounded-lg p-6 bg-white shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <HelpCircle className="text-teal-700 h-6 w-6 mt-0.5" />
          <h2 className="text-lg font-medium">{q.question}</h2>
        </div>
        
        {q.type === "radio" && q.options && (
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
        
        {q.type === "checkbox" && q.options && (
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
        
        {q.type === "textarea" && (
          <div className="ml-9">
            <Textarea 
              value={answers[q.id] || ""} 
              onChange={(e) => handleTextareaChange(q.id, e.target.value)}
              placeholder="Bitte geben Sie Details ein"
              className="w-full"
            />
          </div>
        )}
      </div>
    );
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
        
        <h1 className="text-3xl font-bold mt-6 mb-2">Medizinische Vorgeschichte</h1>
        <p className="text-muted-foreground">
          Bitte beantworten Sie die folgenden Fragen zu Ihrer Gesundheit
        </p>
      </header>

      <div className="space-y-8 mb-4">
        <h2 className="text-xl font-semibold">Persönliche Krankengeschichte</h2>
        {personalQuestions.map(renderQuestion)}
      </div>
      
      <div className="space-y-8 pb-20">
        <h2 className="text-xl font-semibold mt-8">Familiäre Krankengeschichte</h2>
        {familyQuestions.map(renderQuestion)}
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

export default MedicalHistory;

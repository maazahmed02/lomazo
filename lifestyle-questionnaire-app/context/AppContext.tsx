import React, { createContext, useState, useContext, ReactNode } from 'react';

// Types
type LifestyleData = {
  name: string;
  smoking_status: string;
  smoking_frequency: string;
  alcohol_consumption: string;
  alcohol_frequency: string;
  exercise_frequency: string;
  exercise_duration: string;
  exercise_type: string;
  diet_type: string;
  diet_quality: string;
  stress_level: string;
};

type DocumentFile = {
  name: string;
  type: string;
  uri: string;
  id?: string;
  summary?: string;
  fullText?: string;
  processed?: boolean;
};

type AppStage = 'lifestyle' | 'documents' | 'summary';

// Context type definition
type AppContextType = {
  stage: AppStage;
  moveToNext: () => void;
  lifestyleData: LifestyleData;
  setLifestyleData: (data: LifestyleData) => void;
  documentFiles: DocumentFile[];
  addDocumentFile: (file: DocumentFile) => void;
  updateDocumentFile: (index: number, updates: Partial<DocumentFile>) => void;
  removeDocumentFile: (index: number) => void;
  resetDocumentFiles: () => void;
  isLifestyleSubmitted: boolean;
  setIsLifestyleSubmitted: (value: boolean) => void;
  resetToStart: () => void;
  selectedDocumentIndex: number | null;
  setSelectedDocumentIndex: (index: number | null) => void;
  docProcessingStatus: 'idle' | 'processing' | 'complete' | 'error';
  setDocProcessingStatus: (status: 'idle' | 'processing' | 'complete' | 'error') => void;
};

// Default values
const defaultLifestyleData: LifestyleData = {
  name: '',
  smoking_status: '',
  smoking_frequency: '',
  alcohol_consumption: '',
  alcohol_frequency: '',
  exercise_frequency: '',
  exercise_duration: '',
  exercise_type: '',
  diet_type: '',
  diet_quality: '',
  stress_level: '',
};

// Create the context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stage, setStage] = useState<AppStage>('lifestyle');
  const [lifestyleData, setLifestyleData] = useState<LifestyleData>(defaultLifestyleData);
  const [documentFiles, setDocumentFiles] = useState<DocumentFile[]>([]);
  const [isLifestyleSubmitted, setIsLifestyleSubmitted] = useState(false);
  const [selectedDocumentIndex, setSelectedDocumentIndex] = useState<number | null>(null);
  const [docProcessingStatus, setDocProcessingStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');

  const moveToNext = () => {
    if (stage === 'lifestyle') {
      setStage('documents');
    } else if (stage === 'documents') {
      setStage('summary');
    }
  };

  const addDocumentFile = (file: DocumentFile) => {
    setDocumentFiles(prev => [...prev, file]);
  };

  const updateDocumentFile = (index: number, updates: Partial<DocumentFile>) => {
    setDocumentFiles(prev => {
      const newFiles = [...prev];
      newFiles[index] = { ...newFiles[index], ...updates };
      return newFiles;
    });
  };

  const removeDocumentFile = (index: number) => {
    setDocumentFiles(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const resetDocumentFiles = () => {
    setDocumentFiles([]);
  };

  const resetToStart = () => {
    setStage('lifestyle');
    setLifestyleData(defaultLifestyleData);
    setDocumentFiles([]);
    setIsLifestyleSubmitted(false);
    setSelectedDocumentIndex(null);
    setDocProcessingStatus('idle');
  };

  return (
    <AppContext.Provider
      value={{
        stage,
        moveToNext,
        lifestyleData,
        setLifestyleData,
        documentFiles,
        addDocumentFile,
        updateDocumentFile,
        removeDocumentFile,
        resetDocumentFiles,
        isLifestyleSubmitted,
        setIsLifestyleSubmitted,
        resetToStart,
        selectedDocumentIndex,
        setSelectedDocumentIndex,
        docProcessingStatus,
        setDocProcessingStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for using the context
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 
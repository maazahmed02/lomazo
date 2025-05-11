import React from 'react';
import { StyleSheet, SafeAreaView, ScrollView, View, useWindowDimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import LifestyleQuestionnaire from '../components/LifestyleQuestionnaire';
import DocumentUpload from '../components/DocumentUpload';
import SummaryPage from '../components/SummaryPage';
import { Colors } from '@/constants/Colors';
import { AppProvider, useAppContext } from '@/context/AppContext';

// Main content component that uses the context
function MainContent() {
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const colors = Colors[colorScheme ?? 'light'];
  const isSmallScreen = width < 375;
  const maxContentWidth = Math.min(width * 0.92, 550);
  
  const { stage } = useAppContext();
  
  // Get title based on current stage
  const getStageTitle = () => {
    switch(stage) {
      case 'lifestyle':
        return 'Lifestyle Questionnaire';
      case 'documents':
        return 'Document Upload';
      case 'summary':
        return 'Patient Summary';
      default:
        return 'Health Portal';
    }
  };
  
  // Get subtitle based on current stage
  const getStageSubtitle = () => {
    switch(stage) {
      case 'lifestyle':
        return 'Please complete this health questionnaire';
      case 'documents':
        return 'Upload your relevant medical documents';
      case 'summary':
        return 'Doctor\'s Review';
      default:
        return 'Manage your health data in one place';
    }
  };
  
  // Render active component based on stage
  const renderActiveComponent = () => {
    switch(stage) {
      case 'lifestyle':
        return <LifestyleQuestionnaire />;
      case 'documents':
        return <DocumentUpload />;
      case 'summary':
        return <SummaryPage />;
      default:
        return <LifestyleQuestionnaire />;
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedView 
        style={[
          styles.header, 
          { backgroundColor: colors.headerBackground }
        ]}
      >
        <ThemedText 
          type="title" 
          style={[styles.title, { color: colors.text }]}
        >
          {getStageTitle()}
        </ThemedText>
        
        <ThemedText 
          style={[styles.subtitle, { color: colors.text }]}
        >
          {getStageSubtitle()}
        </ThemedText>
      </ThemedView>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { maxWidth: maxContentWidth, width: maxContentWidth }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {renderActiveComponent()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Root component that wraps everything with the context provider
export default function MainScreen() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#34B669",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 28,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 10,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
    alignSelf: 'center',
  },
  contentWrapper: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    shadowColor: "#34B669",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 6,
  }
}); 
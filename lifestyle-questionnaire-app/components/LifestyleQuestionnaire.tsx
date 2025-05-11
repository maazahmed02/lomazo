import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, ScrollView, useWindowDimensions, Pressable, Animated } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from './ui/IconSymbol';
import { useAppContext } from '@/context/AppContext';

// Radio option type
type RadioOption = {
  value: string;
  label: string;
};

type QuestionType = 
  | 'name'
  | 'smoking_status'
  | 'smoking_frequency'
  | 'alcohol_consumption'
  | 'alcohol_frequency'
  | 'exercise_frequency'
  | 'exercise_duration'
  | 'exercise_type'
  | 'diet_type'
  | 'diet_quality'
  | 'stress_level'
  | 'review';

// Select component for single option selection
const SelectOption = ({ 
  options, 
  value, 
  onSelect, 
  colors 
}: { 
  options: RadioOption[]; 
  value: string; 
  onSelect: (value: string) => void; 
  colors: any;
}) => {
  return (
    <View style={styles.radioGroup}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.radioOption,
            {
              backgroundColor: value === option.value ? colors.accentLight : colors.inputBackground,
              borderColor: value === option.value ? colors.tint : colors.inputBorder,
            },
          ]}
          onPress={() => onSelect(option.value)}
        >
          <View
            style={[
              styles.radioButton,
              {
                borderColor: value === option.value ? colors.tint : '#D1D1D6',
              },
            ]}
          >
            {value === option.value && (
              <View
                style={[
                  styles.radioButtonSelected,
                  {
                    backgroundColor: colors.tint,
                  },
                ]}
              />
            )}
          </View>
          <ThemedText style={styles.radioLabel}>{option.label}</ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Frequency select for smoking and alcohol
const FrequencySelect = ({ 
  type, 
  value, 
  onChange, 
  colors 
}: { 
  type: 'smoking' | 'alcohol'; 
  value: string; 
  onChange: (value: string) => void; 
  colors: any;
}) => {
  const options = type === 'smoking' 
    ? [
        { value: '1-5 cigarettes/day', label: '1-5 cigarettes/day' },
        { value: '6-10 cigarettes/day', label: '6-10 cigarettes/day' },
        { value: '11-20 cigarettes/day', label: '11-20 cigarettes/day' },
        { value: '20+ cigarettes/day', label: '20+ cigarettes/day' },
      ]
    : [
        { value: '1-2 drinks/week', label: '1-2 drinks/week' },
        { value: '3-5 drinks/week', label: '3-5 drinks/week' },
        { value: '5-10 drinks/week', label: '5-10 drinks/week' },
        { value: '10+ drinks/week', label: '10+ drinks/week' },
      ];

  return (
    <View style={styles.frequencyContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.frequencyOption,
            {
              backgroundColor: value === option.value ? colors.accentLight : colors.inputBackground,
              borderColor: value === option.value ? colors.tint : colors.inputBorder,
            },
          ]}
          onPress={() => onChange(option.value)}
        >
          <ThemedText style={[
            styles.frequencyLabel,
            { color: value === option.value ? colors.tint : colors.text }
          ]}>
            {option.label}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Progress indicator component
const ProgressBar = ({ 
  currentStep, 
  totalSteps,
  colors
}: { 
  currentStep: number; 
  totalSteps: number;
  colors: any;
}) => {
  const progress = (currentStep / totalSteps) * 100;
  
  return (
    <View style={styles.progressContainer}>
      <View style={[styles.progressTrack, { backgroundColor: colors.inputBackground }]}>
        <View 
          style={[
            styles.progressFill, 
            { 
              backgroundColor: colors.tint,
              width: `${progress}%` 
            }
          ]} 
        />
      </View>
      <ThemedText style={styles.progressText}>
        {currentStep} of {totalSteps}
      </ThemedText>
    </View>
  );
};

export default function LifestyleQuestionnaire() {
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const colors = Colors[colorScheme ?? 'light'];
  const isSmallScreen = width < 375;
  
  const { lifestyleData, setLifestyleData, moveToNext, setIsLifestyleSubmitted } = useAppContext();
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionType>('name');
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  
  // Option sets for selection controls
  const smokingOptions = [
    { value: 'Never', label: 'Never Smoked' },
    { value: 'Former', label: 'Former Smoker' },
    { value: 'Current', label: 'Current Smoker' },
  ];

  const alcoholOptions = [
    { value: 'None', label: 'None' },
    { value: 'Occasional', label: 'Occasional' },
    { value: 'Regular', label: 'Regular' },
  ];

  const exerciseFrequencyOptions = [
    { value: 'None', label: 'No regular exercise' },
    { value: '1-2 times/week', label: '1-2 times/week' },
    { value: '3-4 times/week', label: '3-4 times/week' },
    { value: '5+ times/week', label: '5+ times/week' },
  ];

  const exerciseDurationOptions = [
    { value: 'Less than 15 minutes', label: 'Less than 15 minutes' },
    { value: '15-30 minutes', label: '15-30 minutes' },
    { value: '30-60 minutes', label: '30-60 minutes' },
    { value: '60+ minutes', label: '60+ minutes' },
  ];

  const exerciseTypeOptions = [
    { value: 'Cardio', label: 'Cardio' },
    { value: 'Strength training', label: 'Strength training' },
    { value: 'Mixed', label: 'Mixed' },
    { value: 'Sports', label: 'Sports' },
    { value: 'Other', label: 'Other' },
  ];

  const dietTypeOptions = [
    { value: 'Regular', label: 'Regular' },
    { value: 'Vegetarian', label: 'Vegetarian' },
    { value: 'Vegan', label: 'Vegan' },
    { value: 'Keto', label: 'Keto' },
    { value: 'Paleo', label: 'Paleo' },
    { value: 'Other', label: 'Other' },
  ];

  const dietQualityOptions = [
    { value: 'Mostly healthy', label: 'Mostly healthy' },
    { value: 'Mixed', label: 'Mixed' },
    { value: 'Mostly unhealthy', label: 'Mostly unhealthy' },
  ];

  const stressLevelOptions = [
    { value: 'Low', label: 'Low' },
    { value: 'Moderate', label: 'Moderate' },
    { value: 'High', label: 'High' },
  ];

  const handleChange = (key: string, value: string) => {
    setLifestyleData({ ...lifestyleData, [key]: value });
  };

  // Determine the sequence of questions based on previous answers
  const getNextQuestion = (current: QuestionType): QuestionType => {
    switch (current) {
      case 'name':
        return 'smoking_status';
      case 'smoking_status':
        return lifestyleData.smoking_status === 'Current' ? 'smoking_frequency' : 'alcohol_consumption';
      case 'smoking_frequency':
        return 'alcohol_consumption';
      case 'alcohol_consumption':
        return lifestyleData.alcohol_consumption !== 'None' ? 'alcohol_frequency' : 'exercise_frequency';
      case 'alcohol_frequency':
        return 'exercise_frequency';
      case 'exercise_frequency':
        return lifestyleData.exercise_frequency === 'None' ? 'diet_type' : 'exercise_duration';
      case 'exercise_duration':
        return 'exercise_type';
      case 'exercise_type':
        return 'diet_type';
      case 'diet_type':
        return 'diet_quality';
      case 'diet_quality':
        return 'stress_level';
      case 'stress_level':
        return 'review';
      default:
        return 'review';
    }
  };

  // Handle "Continue" button press to move to next question
  const handleContinue = () => {
    // Validate current question
    if (currentQuestion === 'name' && !lifestyleData.name.trim()) {
      setMessage('Please enter your name');
      return;
    }
    
    // Fade out animation
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Move to next question
      setCurrentQuestion(getNextQuestion(currentQuestion));
      
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch('http://localhost:5050/api/lifestyle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lifestyleData),
      });
      const data = await response.json();
      setMessage('Success! Your lifestyle data has been saved.');
      setIsLifestyleSubmitted(true);
      
      // After a short delay, move to the next screen
      setTimeout(() => {
        moveToNext();
      }, 1000);
    } catch (error) {
      setMessage('Error: Failed to submit your data. Please try again.');
      console.error('Error submitting lifestyle data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress
  const getQuestionCount = (): number => {
    let totalQuestions = 8; // Base questions
    
    if (lifestyleData.smoking_status === 'Current') {
      totalQuestions += 1;
    }
    
    if (lifestyleData.alcohol_consumption !== 'None') {
      totalQuestions += 1;
    }
    
    if (lifestyleData.exercise_frequency !== 'None') {
      totalQuestions += 2;
    }
    
    return totalQuestions;
  };
  
  const getCurrentStep = (): number => {
    // Calculate base step depending on previous questions
    let baseStep = 1; // Start with 1
    
    // Add steps based on current position in questionnaire
    if (currentQuestion === 'name') return 1;
    baseStep++; // Now at 2
    
    if (currentQuestion === 'smoking_status') return baseStep;
    
    // Smoking frequency is only shown for current smokers
    if (lifestyleData.smoking_status === 'Current') {
      baseStep++; // Add a step for smoking frequency
      if (currentQuestion === 'smoking_frequency') return baseStep;
    }
    
    baseStep++; // Now at 3 or 4 depending on smoking status
    if (currentQuestion === 'alcohol_consumption') return baseStep;
    
    // Alcohol frequency only shown for drinkers
    if (lifestyleData.alcohol_consumption !== 'None') {
      baseStep++; // Add a step for alcohol frequency
      if (currentQuestion === 'alcohol_frequency') return baseStep;
    }
    
    baseStep++; // Now at 4, 5, or 6 depending on previous answers
    if (currentQuestion === 'exercise_frequency') return baseStep;
    
    // Exercise details only shown for those who exercise
    if (lifestyleData.exercise_frequency !== 'None') {
      baseStep++; // Add step for exercise duration
      if (currentQuestion === 'exercise_duration') return baseStep;
      
      baseStep++; // Add step for exercise type
      if (currentQuestion === 'exercise_type') return baseStep;
    }
    
    baseStep++; // Now at diet_type step
    if (currentQuestion === 'diet_type') return baseStep;
    
    baseStep++; // Now at diet_quality step
    if (currentQuestion === 'diet_quality') return baseStep;
    
    baseStep++; // Now at stress_level step
    if (currentQuestion === 'stress_level') return baseStep;
    
    // Review is the final step
    if (currentQuestion === 'review') return getQuestionCount() + 1;
    
    return baseStep; // Fallback
  };
  
  // Review all answers function
  const renderReview = () => {
    return (
      <View style={styles.reviewContainer}>
        <ThemedText type="defaultSemiBold" style={styles.reviewTitle}>
          Please review your information
        </ThemedText>
        
        <View style={styles.reviewItem}>
          <ThemedText style={styles.reviewLabel}>Name:</ThemedText>
          <ThemedText style={styles.reviewValue}>{lifestyleData.name}</ThemedText>
        </View>
        
        <View style={styles.reviewItem}>
          <ThemedText style={styles.reviewLabel}>Smoking Status:</ThemedText>
          <ThemedText style={styles.reviewValue}>
            {lifestyleData.smoking_status}
            {lifestyleData.smoking_status === 'Current' && ` (${lifestyleData.smoking_frequency})`}
          </ThemedText>
        </View>
        
        <View style={styles.reviewItem}>
          <ThemedText style={styles.reviewLabel}>Alcohol Consumption:</ThemedText>
          <ThemedText style={styles.reviewValue}>
            {lifestyleData.alcohol_consumption}
            {lifestyleData.alcohol_consumption !== 'None' && ` (${lifestyleData.alcohol_frequency})`}
          </ThemedText>
        </View>
        
        <View style={styles.reviewItem}>
          <ThemedText style={styles.reviewLabel}>Exercise:</ThemedText>
          <ThemedText style={styles.reviewValue}>
            {lifestyleData.exercise_frequency === 'None' 
              ? 'No regular exercise' 
              : `${lifestyleData.exercise_frequency}, ${lifestyleData.exercise_duration} (${lifestyleData.exercise_type})`}
          </ThemedText>
        </View>
        
        <View style={styles.reviewItem}>
          <ThemedText style={styles.reviewLabel}>Diet:</ThemedText>
          <ThemedText style={styles.reviewValue}>
            {lifestyleData.diet_type} - {lifestyleData.diet_quality}
          </ThemedText>
        </View>
        
        <View style={styles.reviewItem}>
          <ThemedText style={styles.reviewLabel}>Stress Level:</ThemedText>
          <ThemedText style={styles.reviewValue}>
            {lifestyleData.stress_level}
          </ThemedText>
        </View>
      </View>
    );
  };

  // Render the current question
  const renderCurrentQuestion = () => {
    switch (currentQuestion) {
      case 'name':
        return (
          <>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Let's start with your name
            </ThemedText>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder 
                }
              ]}
              placeholder="Enter your name"
              placeholderTextColor={colorScheme === 'dark' ? '#8e8e93' : '#aeaeb2'}
              value={lifestyleData.name}
              onChangeText={text => handleChange('name', text)}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={handleContinue}
            />
          </>
        );
      
      case 'smoking_status':
        return (
          <>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Smoking Habits
            </ThemedText>
            <ThemedText style={styles.questionText}>Do you smoke?</ThemedText>
            <SelectOption 
              options={smokingOptions} 
              value={lifestyleData.smoking_status} 
              onSelect={(value) => handleChange('smoking_status', value)} 
              colors={colors}
            />
          </>
        );
        
      case 'smoking_frequency':
        return (
          <>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Smoking Frequency
            </ThemedText>
            <ThemedText style={styles.questionText}>How much do you smoke?</ThemedText>
            <FrequencySelect
              type="smoking"
              value={lifestyleData.smoking_frequency}
              onChange={(value) => handleChange('smoking_frequency', value)}
              colors={colors}
            />
          </>
        );
        
      case 'alcohol_consumption':
        return (
          <>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Alcohol Consumption
            </ThemedText>
            <ThemedText style={styles.questionText}>How often do you drink alcohol?</ThemedText>
            <SelectOption 
              options={alcoholOptions} 
              value={lifestyleData.alcohol_consumption} 
              onSelect={(value) => handleChange('alcohol_consumption', value)} 
              colors={colors}
            />
          </>
        );
        
      case 'alcohol_frequency':
        return (
          <>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Alcohol Frequency
            </ThemedText>
            <ThemedText style={styles.questionText}>How much do you drink?</ThemedText>
            <FrequencySelect
              type="alcohol"
              value={lifestyleData.alcohol_frequency}
              onChange={(value) => handleChange('alcohol_frequency', value)}
              colors={colors}
            />
          </>
        );
        
      case 'exercise_frequency':
        return (
          <>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Exercise Habits
            </ThemedText>
            <ThemedText style={styles.questionText}>How often do you exercise?</ThemedText>
            <SelectOption 
              options={exerciseFrequencyOptions} 
              value={lifestyleData.exercise_frequency} 
              onSelect={(value) => handleChange('exercise_frequency', value)} 
              colors={colors}
            />
          </>
        );
        
      case 'exercise_duration':
        return (
          <>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Exercise Duration
            </ThemedText>
            <ThemedText style={styles.questionText}>How long do you typically exercise?</ThemedText>
            <SelectOption 
              options={exerciseDurationOptions} 
              value={lifestyleData.exercise_duration} 
              onSelect={(value) => handleChange('exercise_duration', value)} 
              colors={colors}
            />
          </>
        );
        
      case 'exercise_type':
        return (
          <>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Exercise Type
            </ThemedText>
            <ThemedText style={styles.questionText}>What type of exercise do you do?</ThemedText>
            <SelectOption 
              options={exerciseTypeOptions} 
              value={lifestyleData.exercise_type} 
              onSelect={(value) => handleChange('exercise_type', value)} 
              colors={colors}
            />
          </>
        );
        
      case 'diet_type':
        return (
          <>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Diet Information
            </ThemedText>
            <ThemedText style={styles.questionText}>What type of diet do you follow?</ThemedText>
            <SelectOption 
              options={dietTypeOptions} 
              value={lifestyleData.diet_type} 
              onSelect={(value) => handleChange('diet_type', value)} 
              colors={colors}
            />
          </>
        );
        
      case 'diet_quality':
        return (
          <>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Diet Quality
            </ThemedText>
            <ThemedText style={styles.questionText}>How would you rate your diet quality?</ThemedText>
            <SelectOption 
              options={dietQualityOptions} 
              value={lifestyleData.diet_quality} 
              onSelect={(value) => handleChange('diet_quality', value)} 
              colors={colors}
            />
          </>
        );
        
      case 'stress_level':
        return (
          <>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Stress Level
            </ThemedText>
            <ThemedText style={styles.questionText}>How would you rate your stress level?</ThemedText>
            <SelectOption 
              options={stressLevelOptions} 
              value={lifestyleData.stress_level} 
              onSelect={(value) => handleChange('stress_level', value)} 
              colors={colors}
            />
          </>
        );
        
      case 'review':
        return renderReview();
        
      default:
        return null;
    }
  };

  return (
    <ThemedView style={styles.container}>
      {currentQuestion !== 'review' && (
        <ProgressBar 
          currentStep={getCurrentStep()} 
          totalSteps={getQuestionCount()}
          colors={colors}
        />
      )}
      
      <Animated.View style={[
        styles.questionContainer,
        { 
          backgroundColor: colors.accentLight,
          opacity: fadeAnim 
        }
      ]}>
        {renderCurrentQuestion()}
      </Animated.View>
      
      <TouchableOpacity 
        style={[
          styles.actionButton, 
          { backgroundColor: colors.tint },
          loading && styles.buttonDisabled
        ]} 
        onPress={currentQuestion !== 'review' ? handleContinue : handleSubmit} 
        disabled={loading}
      >
        <ThemedText style={styles.actionButtonText}>
          {loading ? 'Submitting...' : currentQuestion !== 'review' ? 'Continue' : 'Submit Questionnaire'}
        </ThemedText>
        <IconSymbol 
          name="arrow.right" 
          size={22} 
          color="#fff" 
          style={{ marginLeft: 10 }}
        />
      </TouchableOpacity>
      
      {message && (
        <ThemedText style={[
          styles.message,
          { 
            color: message.startsWith('Error') ? colors.error : colors.success
          }
        ]}>
          {message}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    flex: 1,
    marginRight: 10,
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    opacity: 0.7,
  },
  questionContainer: {
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    marginBottom: 20,
  },
  questionText: {
    fontSize: 16,
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    fontSize: 18,
  },
  radioGroup: {
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  radioButton: {
    height: 22,
    width: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    height: 12,
    width: 12,
    borderRadius: 6,
  },
  radioLabel: {
    marginLeft: 10,
    fontSize: 16,
  },
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  frequencyOption: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    width: '48%',
    alignItems: 'center',
  },
  frequencyLabel: {
    fontSize: 14,
  },
  reviewContainer: {
    paddingVertical: 10,
  },
  reviewTitle: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  reviewItem: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  reviewLabel: {
    width: '40%',
    fontWeight: '600',
    fontSize: 16,
  },
  reviewValue: {
    flex: 1,
    fontSize: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4.65,
    elevation: 6,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  message: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    padding: 12,
  },
}); 
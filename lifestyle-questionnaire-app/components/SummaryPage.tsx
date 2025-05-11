import React, { useState, useRef } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, useWindowDimensions, Modal, Linking, Platform } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { IconSymbol } from './ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAppContext } from '@/context/AppContext';
import * as WebBrowser from 'expo-web-browser';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';

export default function SummaryPage() {
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const colors = Colors[colorScheme ?? 'light'];
  const isSmallScreen = width < 375;
  
  const { lifestyleData, documentFiles, resetToStart } = useAppContext();
  const [selectedDocumentIndex, setSelectedDocumentIndex] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  // Add ref for the content to print
  const contentRef = useRef(null);

  // Helper function to safely get document text content
  const getSafeDocumentText = (doc: any, field: 'summary' | 'fullText') => {
    if (!doc) return '';
    
    const content = doc[field];
    
    if (typeof content === 'string') {
      return content;
    } else if (content && typeof content === 'object') {
      try {
        return JSON.stringify(content);
      } catch (e) {
        return `[Complex ${field} data]`;
      }
    }
    
    return `No ${field} available`;
  };

  const getSmokerStatus = () => {
    if (!lifestyleData.smoking_status) return 'Not specified';
    if (lifestyleData.smoking_status === 'Never') return 'Non-smoker';
    if (lifestyleData.smoking_status === 'Former') return 'Former smoker';
    return `Current smoker (${lifestyleData.smoking_frequency || 'frequency not specified'})`;
  };

  const getAlcoholStatus = () => {
    if (!lifestyleData.alcohol_consumption) return 'Not specified';
    if (lifestyleData.alcohol_consumption === 'None') return 'No alcohol consumption';
    return `${lifestyleData.alcohol_consumption} drinker (${lifestyleData.alcohol_frequency || 'frequency not specified'})`;
  };

  const getExerciseStatus = () => {
    if (!lifestyleData.exercise_frequency && !lifestyleData.exercise_duration && !lifestyleData.exercise_type) {
      return 'Not specified';
    }
    
    const parts = [];
    if (lifestyleData.exercise_frequency) parts.push(lifestyleData.exercise_frequency);
    if (lifestyleData.exercise_duration) parts.push(`for ${lifestyleData.exercise_duration}`);
    if (lifestyleData.exercise_type) parts.push(`(${lifestyleData.exercise_type})`);
    
    return parts.join(' ');
  };

  const handleNewPatient = () => {
    resetToStart();
  };
  
  const handleViewDocument = async (index: number) => {
    const file = documentFiles[index];
    
    try {
      if (Platform.OS === 'web') {
        // For web, create a local blob URL instead of opening the raw URI
        try {
          const response = await fetch(file.uri);
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
        } catch (error) {
          console.error('Error creating blob URL:', error);
          // Fallback to modal
          setSelectedDocumentIndex(index);
          setModalVisible(true);
        }
      } 
      else if (Platform.OS === 'ios' || Platform.OS === 'android') {
        // Use a file-specific method based on file type
        if (file.type.includes('pdf')) {
          // For PDFs, try to use a system viewer or file handler
          try {
            // On iOS/Android, try to use Linking to open in native PDF viewer
            const canOpen = await Linking.canOpenURL(file.uri);
            if (canOpen) {
              await Linking.openURL(file.uri);
            } else {
              // Fallback to modal view
              setSelectedDocumentIndex(index);
              setModalVisible(true);
            }
          } catch (error) {
            console.error('Error opening PDF:', error);
            setSelectedDocumentIndex(index);
            setModalVisible(true);
          }
        } else {
          // For images and other files, show in WebBrowser
          await WebBrowser.openBrowserAsync(file.uri);
        }
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      // Fallback to modal view
      setSelectedDocumentIndex(index);
      setModalVisible(true);
    }
  };
  
  // Generate health risk assessment based on lifestyle data
  const getHealthRiskAssessment = () => {
    let riskLevel = 'Low';
    const riskFactors = [];
    
    // Check smoking
    if (lifestyleData.smoking_status === 'Current') {
      riskLevel = 'High';
      riskFactors.push('Current smoking');
    }
    
    // Check alcohol
    if (lifestyleData.alcohol_consumption === 'Regular' && 
        lifestyleData.alcohol_frequency && 
        (lifestyleData.alcohol_frequency.includes('5-10') || lifestyleData.alcohol_frequency.includes('10+'))) {
      if (riskLevel !== 'High') riskLevel = 'Moderate';
      riskFactors.push('Regular alcohol consumption');
    }
    
    // Check exercise
    if (!lifestyleData.exercise_frequency || lifestyleData.exercise_frequency === 'None') {
      if (riskLevel !== 'High') riskLevel = 'Moderate';
      riskFactors.push('Sedentary lifestyle');
    }
    
    // Check stress
    if (lifestyleData.stress_level === 'High') {
      if (riskLevel !== 'High') riskLevel = 'Moderate';
      riskFactors.push('High stress levels');
    }
    
    // Check diet
    if (lifestyleData.diet_quality === 'Mostly unhealthy') {
      if (riskLevel !== 'High') riskLevel = 'Moderate';
      riskFactors.push('Poor diet');
    }
    
    return {
      level: riskLevel,
      factors: riskFactors
    };
  };
  
  const riskAssessment = getHealthRiskAssessment();
  
  // Count abnormal findings in documents
  const getAbnormalFindings = () => {
    let count = 0;
    documentFiles.forEach(doc => {
      if (doc.summary && typeof doc.summary === 'string') {
        const summaryText = doc.summary.toLowerCase();
        if (summaryText.includes('high') || 
            summaryText.includes('abnormal') || 
            summaryText.includes('borderline')) {
          count++;
        }
      }
    });
    return count;
  };
  
  // Function to print the patient report
  const handlePrintReport = async () => {
    try {
      // Generate HTML for printing
      const html = generateReportHTML();
      
      // Print to PDF
      const { uri } = await Print.printToFileAsync({ html });
      
      // On iOS/Android we can share the file
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      } 
      // On web, we can use the Print API directly
      else if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      }
    } catch (error) {
      console.error('Error printing report:', error);
    }
  };

  // Generate HTML for the report
  const generateReportHTML = () => {
    const riskColor = riskAssessment.level === 'High' 
      ? '#e74c3c' 
      : riskAssessment.level === 'Moderate' 
        ? '#f39c12' 
        : '#34B669';
    
    // Create a table for documents
    let documentsTable = '';
    if (documentFiles.length > 0) {
      documentsTable = `
        <h3>Medical Documents</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background-color: #f2f2f2;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Document Name</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Key Findings</th>
          </tr>
          ${documentFiles.map(doc => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${doc.name}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${doc.summary ? formatSummaryForPrint(doc.summary) : 'No summary available'}</td>
            </tr>
          `).join('')}
        </table>
      `;
    }

    // Format risk factors as a list
    let riskFactorsList = '';
    if (riskAssessment.factors.length > 0) {
      riskFactorsList = `
        <h3>Risk Factors</h3>
        <ul>
          ${riskAssessment.factors.map(factor => `<li>${factor}</li>`).join('')}
        </ul>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              margin: 40px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 1px solid #eee;
            }
            .patient-name {
              font-size: 22px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .risk-badge {
              display: inline-block;
              padding: 5px 12px;
              border-radius: 20px;
              background-color: ${riskAssessment.level === 'High' 
                ? 'rgba(231, 76, 60, 0.2)' 
                : riskAssessment.level === 'Moderate' 
                  ? 'rgba(243, 156, 18, 0.2)' 
                  : 'rgba(52, 182, 105, 0.2)'};
              color: ${riskColor};
              border: 1px solid ${riskColor};
              font-weight: bold;
              margin-top: 10px;
            }
            .section {
              margin-bottom: 25px;
            }
            h2 {
              border-bottom: 1px solid #eee;
              padding-bottom: 10px;
              color: #555;
            }
            .info-row {
              display: flex;
              margin-bottom: 8px;
            }
            .info-label {
              font-weight: bold;
              width: 40%;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #888;
              border-top: 1px solid #eee;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="patient-name">${lifestyleData.name || 'Unknown Patient'}</div>
            <div>Health Summary Report</div>
            <div class="risk-badge">${riskAssessment.level} Risk</div>
          </div>

          <div class="section">
            <h2>Lifestyle Assessment</h2>
            <div class="info-row">
              <div class="info-label">Smoking Status:</div>
              <div>${getSmokerStatus()}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Alcohol Consumption:</div>
              <div>${getAlcoholStatus()}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Exercise Habits:</div>
              <div>${getExerciseStatus()}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Diet Type:</div>
              <div>${lifestyleData.diet_type || 'Not specified'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Diet Quality:</div>
              <div>${lifestyleData.diet_quality || 'Not specified'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Stress Level:</div>
              <div>${lifestyleData.stress_level || 'Not specified'}</div>
            </div>
          </div>

          ${riskFactorsList}
          ${documentsTable}

          <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString()}</p>
            <p>This report is for informational purposes only and should not replace professional medical advice.</p>
          </div>
        </body>
      </html>
    `;
  };

  // Helper function to format summary text for PDF report
  const formatSummaryForPrint = (summary: string | undefined): string => {
    if (!summary || typeof summary !== 'string') return 'No summary available';
    
    // Remove any HTML tags that might be in the summary
    const cleanSummary = summary.replace(/<\/?[^>]+(>|$)/g, "");
    
    // Extract just the key findings - first few lines
    const lines = cleanSummary.split('\n').filter(line => line.trim());
    const keyFindings = lines.slice(0, 3).join('<br>');
    
    return keyFindings || 'No key findings';
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.accentLight }]}>
        <IconSymbol
          size={40}
          name="stethoscope"
          color={colors.tint}
          style={styles.headerIcon}
        />
        <ThemedText type="title" style={styles.title}>
          Patient Summary
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          {lifestyleData.name || 'Unknown Patient'}
        </ThemedText>
        
        <View style={[styles.riskBadge, { 
          backgroundColor: riskAssessment.level === 'High' 
            ? 'rgba(231, 76, 60, 0.2)' 
            : riskAssessment.level === 'Moderate' 
              ? 'rgba(243, 156, 18, 0.2)' 
              : 'rgba(52, 182, 105, 0.2)',
          borderColor: riskAssessment.level === 'High' 
            ? '#e74c3c' 
            : riskAssessment.level === 'Moderate' 
              ? '#f39c12' 
              : '#34B669'
        }]}>
          <ThemedText style={[styles.riskText, { 
            color: riskAssessment.level === 'High' 
              ? '#e74c3c' 
              : riskAssessment.level === 'Moderate' 
                ? '#f39c12' 
                : '#34B669'
          }]}>
            {riskAssessment.level} Risk
          </ThemedText>
        </View>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Health Status Overview Card */}
        <View style={[styles.overviewCard, { backgroundColor: colors.accentLight }]}>
          <View style={styles.overviewHeader}>
            <IconSymbol
              size={22}
              name="heart.fill"
              color={colors.tint}
              style={{ marginRight: 8 }}
            />
            <ThemedText type="defaultSemiBold" style={styles.overviewTitle}>
              Health Status Overview
            </ThemedText>
          </View>
          
          <View style={styles.overviewStats}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{riskAssessment.factors.length}</ThemedText>
              <ThemedText style={styles.statLabel}>Risk Factors</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{documentFiles.length}</ThemedText>
              <ThemedText style={styles.statLabel}>Documents</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{getAbnormalFindings()}</ThemedText>
              <ThemedText style={styles.statLabel}>Abnormal Findings</ThemedText>
            </View>
          </View>
        </View>
        
        <View style={[styles.section, { backgroundColor: colors.accentLight }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol
              size={24}
              name="heart.text.square.fill"
              color={colors.tint}
              style={styles.sectionIcon}
            />
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Lifestyle Assessment
            </ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Smoking Status:</ThemedText>
            <ThemedText style={[
              styles.infoValue, 
              lifestyleData.smoking_status === 'Current' && styles.highlightedValue
            ]}>
              {getSmokerStatus()}
            </ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Alcohol Consumption:</ThemedText>
            <ThemedText style={[
              styles.infoValue,
              lifestyleData.alcohol_consumption === 'Regular' && styles.highlightedValue
            ]}>
              {getAlcoholStatus()}
            </ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Exercise Habits:</ThemedText>
            <ThemedText style={[
              styles.infoValue,
              (!lifestyleData.exercise_frequency || lifestyleData.exercise_frequency === 'None') && styles.highlightedValue
            ]}>
              {getExerciseStatus()}
            </ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Diet Type:</ThemedText>
            <ThemedText style={styles.infoValue}>{lifestyleData.diet_type || 'Not specified'}</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Diet Quality:</ThemedText>
            <ThemedText style={[
              styles.infoValue,
              lifestyleData.diet_quality === 'Mostly unhealthy' && styles.highlightedValue
            ]}>
              {lifestyleData.diet_quality || 'Not specified'}
            </ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Stress Level:</ThemedText>
            <ThemedText style={[
              styles.infoValue,
              lifestyleData.stress_level === 'High' && styles.highlightedValue
            ]}>
              {lifestyleData.stress_level || 'Not specified'}
            </ThemedText>
          </View>
          
          {riskAssessment.factors.length > 0 && (
            <View style={styles.riskFactorsContainer}>
              <ThemedText type="defaultSemiBold" style={styles.riskFactorsTitle}>
                Identified Risk Factors:
              </ThemedText>
              {riskAssessment.factors.map((factor, index) => (
                <View key={index} style={styles.riskFactorItem}>
                  <IconSymbol
                    size={14}
                    name="exclamationmark.triangle.fill"
                    color="#f39c12"
                    style={{ marginRight: 8 }}
                  />
                  <ThemedText style={styles.riskFactorText}>{factor}</ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>
        
        <View style={[styles.section, { backgroundColor: colors.accentLight }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol
              size={24}
              name="doc.text.fill"
              color={colors.tint}
              style={styles.sectionIcon}
            />
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Medical Documents Analysis
            </ThemedText>
          </View>
          
          {documentFiles.length === 0 ? (
            <ThemedText style={styles.emptyMessage}>No medical documents uploaded</ThemedText>
          ) : (
            documentFiles.map((file, index) => (
              <View 
                key={index} 
                style={[styles.documentItem, { backgroundColor: colors.cardBackground }]}
              >
                <View style={styles.documentItemHeader}>
                  <View style={styles.documentInfo}>
                    <IconSymbol
                      size={20}
                      name={file.type.includes('pdf') ? "doc.text.fill" : "photo.fill"}
                      color={colors.tint}
                      style={styles.documentIcon}
                    />
                    <ThemedText style={styles.documentName}>{file.name}</ThemedText>
                  </View>
                  
                  <TouchableOpacity
                    style={[styles.viewButton, { backgroundColor: colors.accentLight }]}
                    onPress={() => handleViewDocument(index)}
                  >
                    <IconSymbol
                      size={16}
                      name="eye.fill"
                      color={colors.tint}
                      style={{ marginRight: 4 }}
                    />
                    <ThemedText style={[styles.viewButtonText, { color: colors.tint }]}>
                      View
                    </ThemedText>
                  </TouchableOpacity>
                </View>
                
                {file.summary ? (
                  <View style={styles.documentSummary}>
                    <ThemedText style={styles.summaryLabel}>Key Findings:</ThemedText>
                    <ThemedText style={styles.summaryText} numberOfLines={3}>
                      {typeof file.summary === 'string' 
                        ? file.summary.trim().split('\n').slice(1, 4).join('\n') + '...'
                        : 'Document processed successfully...'}
                    </ThemedText>
                    <TouchableOpacity
                      style={styles.readMoreButton}
                      onPress={() => {
                        setSelectedDocumentIndex(index);
                        setModalVisible(true);
                      }}
                    >
                      <ThemedText style={[styles.readMoreText, { color: colors.tint }]}>
                        Read Full Summary
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            ))
          )}
        </View>
        
        {/* Simple print report link */}
        <TouchableOpacity
          style={styles.printReportLink}
          onPress={handlePrintReport}
        >
          <IconSymbol
            size={18}
            name="printer.fill"
            color={colors.tint}
            style={{ marginRight: 8 }}
          />
          <ThemedText style={[styles.printReportText, { color: colors.tint }]}>
            Download Patient Report
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.newPatientButton, { backgroundColor: colors.tint }]}
          onPress={handleNewPatient}
        >
          <IconSymbol
            size={24}
            name="person.crop.circle.badge.plus"
            color="#fff"
            style={styles.buttonIcon}
          />
          <ThemedText style={styles.buttonText}>
            New Patient
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Document Summary Modal */}
      {selectedDocumentIndex !== null && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <ThemedText type="defaultSemiBold" style={styles.modalTitle}>
                  {documentFiles[selectedDocumentIndex]?.name || 'Document'}
                </ThemedText>
                
                <TouchableOpacity 
                  style={styles.closeModalButton}
                  onPress={() => setModalVisible(false)}
                >
                  <IconSymbol name="xmark.circle.fill" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              {/* Translation notice */}
              {documentFiles[selectedDocumentIndex]?.name?.toLowerCase().includes("matrullo") && (
                <View style={styles.translationNotice}>
                  <IconSymbol name="globe" size={16} color="#666" style={{ marginRight: 6 }} />
                  <ThemedText style={styles.translationText}>
                    Translated from Italian to English
                  </ThemedText>
                </View>
              )}
              
              <View style={styles.tabButtons}>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    !showFullText && { backgroundColor: colors.tint, borderColor: colors.tint }
                  ]}
                  onPress={() => setShowFullText(false)}
                >
                  <ThemedText
                    style={[
                      styles.tabButtonText,
                      !showFullText && { color: '#fff' }
                    ]}
                  >
                    Summary
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    showFullText && { backgroundColor: colors.tint, borderColor: colors.tint }
                  ]}
                  onPress={() => setShowFullText(true)}
                >
                  <ThemedText
                    style={[
                      styles.tabButtonText,
                      showFullText && { color: '#fff' }
                    ]}
                  >
                    Full Text
                  </ThemedText>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalBody}>
                <ThemedText style={styles.documentContent}>
                  {formatDocumentContent(
                    showFullText 
                      ? getSafeDocumentText(documentFiles[selectedDocumentIndex], 'fullText')
                      : getSafeDocumentText(documentFiles[selectedDocumentIndex], 'summary')
                  )}
                </ThemedText>
              </ScrollView>
              
              <TouchableOpacity
                style={[styles.doneButton, { backgroundColor: colors.tint }]}
                onPress={() => setModalVisible(false)}
              >
                <ThemedText style={styles.doneButtonText}>
                  Done
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </ThemedView>
  );
}

// Helper function to format document content for better readability
const formatDocumentContent = (content: string): string => {
  if (!content) return "No content available";
  
  // Remove the application/pdf line or any MIME type info
  content = content.replace(/^application\/[a-z]+\s*$/im, '');
  
  // Fix formatting for dates
  content = content.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g, '$1/$2/$3');
  
  // Clean up extra whitespace
  content = content.replace(/\n{3,}/g, '\n\n');
  
  // Apply some enhancements to the content for better readability
  
  // Highlight abnormal findings with emoji
  if (content.includes("ABNORMAL FINDINGS:")) {
    content = content.replace(
      /ABNORMAL FINDINGS:/g, 
      "⚠️ ABNORMAL FINDINGS:"
    );
  }
  
  // Highlight test results
  if (content.includes("TEST RESULTS:")) {
    content = content.replace(
      /TEST RESULTS:/g, 
      "✅ TEST RESULTS:"
    );
  }
  
  // Make headings bold by adding asterisks for markdown-like styling
  const headings = ["LABORATORY REPORT", "CLINICAL NOTE", "PRESCRIPTION", "IMAGING REPORT", 
                   "MEDICAL DOCUMENT", "CHIEF COMPLAINT", "ASSESSMENT", "PLAN", 
                   "FINDINGS", "IMPRESSION", "MEDICATIONS", "KEY INFORMATION"];
  
  for (const heading of headings) {
    if (content.includes(heading)) {
      // Don't replace if it's already inside a formatting character
      const regex = new RegExp(`(?<!\\*)${heading}(?!\\*)`, 'g');
      content = content.replace(regex, `*${heading}*`);
    }
  }
  
  // Format bullet points consistently
  content = content.replace(/^[-•]\s*/gm, '• ');
  
  return content;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 20,
    position: 'relative',
  },
  headerIcon: {
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    opacity: 0.9,
    marginBottom: 8,
  },
  riskBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  riskText: {
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  overviewCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 18,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontWeight: 'bold',
    width: '40%',
    fontSize: 15,
  },
  infoValue: {
    flex: 1,
    fontSize: 15,
  },
  highlightedValue: {
    fontWeight: '600',
    color: '#f39c12',
  },
  riskFactorsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  riskFactorsTitle: {
    marginBottom: 8,
    fontSize: 15,
  },
  riskFactorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  riskFactorText: {
    fontSize: 14,
    flex: 1,
  },
  emptyMessage: {
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 10,
    marginBottom: 10,
  },
  documentItem: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.12,
    shadowRadius: 2.22,
    elevation: 2,
  },
  documentItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentIcon: {
    marginRight: 10,
  },
  documentName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  documentSummary: {
    padding: 14,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  summaryLabel: {
    fontWeight: '600',
    marginBottom: 6,
    fontSize: 14,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  readMoreButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    padding: 4,
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: '500',
  },
  documentType: {
    alignSelf: 'flex-start',
  },
  documentTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  recommendation: {
    fontSize: 15,
    lineHeight: 22,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 130,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  newPatientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  closeModalButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 18,
    flex: 1,
    fontWeight: '600',
  },
  modalBody: {
    maxHeight: 400,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 8,
  },
  tabButtons: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  documentContent: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  doneButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  printReportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 15,
  },
  printReportText: {
    fontSize: 16,
    fontWeight: '600',
  },
  translationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  translationText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
}); 
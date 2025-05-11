import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import ParallaxScrollView from '@/components/ParallaxScrollView';

type DocumentFile = {
  uri: string;
  name: string;
  mimeType?: string;
};

export default function DocumentsScreen() {
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; type: string; uri: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      setUploadedFiles(prev => [...prev, {
        name: file.name,
        type: file.mimeType || 'unknown',
        uri: file.uri
      }]);

      // Upload the file to the backend
      await uploadFile(file);
    } catch (error) {
      console.error('Error picking document:', error);
      setMessage('Error picking document');
    }
  };

  const uploadFile = async (file: DocumentFile) => {
    setLoading(true);
    setMessage(null);

    try {
      console.log('Selected file:', file.name);
      
      // For web platform, we need to fetch the file as a blob first
      const fetchResponse = await fetch(file.uri);
      const fileBlob = await fetchResponse.blob();
      
      // Create a simple form data object
      const formData = new FormData();
      formData.append('file', new File([fileBlob], file.name, { type: file.mimeType }));
      formData.append('patient_id', '1');
      formData.append('file_type', file.mimeType?.includes('pdf') ? 'lab_result' : 'medical_image');
      
      console.log('Uploading file');
      
      // Send the file to the server
      const uploadResponse = await fetch('http://localhost:5050/api/documents/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status ${uploadResponse.status}`);
      }

      const data = await uploadResponse.json();
      console.log('Upload successful:', data);
      setMessage('Document uploaded and processed successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage(error instanceof Error ? error.message : 'Error uploading document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="doc.text.fill"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.container}>
        <ThemedText type="title">Document Upload</ThemedText>
        <ThemedText style={styles.subtitle}>
          Upload your medical documents for processing
        </ThemedText>

        <TouchableOpacity
          style={styles.uploadButton}
          onPress={pickDocument}
          disabled={loading}
        >
          <IconSymbol
            size={24}
            name="arrow.up.doc.fill"
            color="#fff"
            style={styles.uploadIcon}
          />
          <ThemedText style={styles.uploadButtonText}>
            {loading ? 'Uploading...' : 'Select Document'}
          </ThemedText>
        </TouchableOpacity>

        {message && (
          <ThemedText style={message.includes('Error') ? styles.error : styles.success}>
            {message}
          </ThemedText>
        )}

        {uploadedFiles.length > 0 && (
          <View style={styles.fileList}>
            <ThemedText type="defaultSemiBold" style={styles.fileListTitle}>
              Uploaded Files
            </ThemedText>
            {uploadedFiles.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <IconSymbol
                  size={20}
                  name="doc.fill"
                  color="#808080"
                  style={styles.fileIcon}
                />
                <ThemedText style={styles.fileName}>{file.name}</ThemedText>
              </View>
            ))}
          </View>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    opacity: 0.7,
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  uploadIcon: {
    marginRight: 10,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fileList: {
    marginTop: 20,
  },
  fileListTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  fileIcon: {
    marginRight: 10,
  },
  fileName: {
    flex: 1,
  },
  success: {
    color: '#34C759',
    textAlign: 'center',
    marginTop: 10,
  },
  error: {
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 10,
  },
  headerImage: {
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
}); 
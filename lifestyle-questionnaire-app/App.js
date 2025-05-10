import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, SafeAreaView, ScrollView } from 'react-native';

export default function App() {
  const [form, setForm] = useState({
    name: '',
    age: '',
    exercise: '',
    diet: '',
    sleep: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5050/api/lifestyle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      Alert.alert('Success', 'Data submitted!');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Lifestyle Questionnaire</Text>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={form.name}
          onChangeText={text => handleChange('name', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Age"
          value={form.age}
          keyboardType="numeric"
          onChangeText={text => handleChange('age', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="How often do you exercise?"
          value={form.exercise}
          onChangeText={text => handleChange('exercise', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Describe your diet"
          value={form.diet}
          onChangeText={text => handleChange('diet', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="How many hours do you sleep?"
          value={form.sleep}
          keyboardType="numeric"
          onChangeText={text => handleChange('sleep', text)}
        />
        <Button title={loading ? 'Submitting...' : 'Submit'} onPress={handleSubmit} disabled={loading} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
}); 
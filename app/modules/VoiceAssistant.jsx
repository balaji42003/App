import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';

const SERVER_URL = 'http://10.3.3.111:5000';

export default function VoiceAssistant() {
  const [textInput, setTextInput] = useState('');
  const [responseText, setResponseText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);

  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      Alert.alert('Error', 'Please enter some text');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`${SERVER_URL}/process_text`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ text: textInput })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResponseText(data.response);
      if (data.audio) {
        await playAudio(data.audio);
      }
    } catch (err) {
      console.error('Text submit error:', err);
      Alert.alert('Error', err.message || 'Failed to process text');
    } finally {
      setIsLoading(false);
    }
  };

  // Audio Recording Functions
  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setAudioUri(null);
    } catch (err) {
      console.error('Recording start error:', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);
    } catch (err) {
      console.error('Recording stop error:', err);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const uploadAudio = async () => {
    if (!audioUri) return;
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        name: 'recording.wav',
        type: 'audio/wav',
      });

      const response = await fetch(`${SERVER_URL}/process_audio`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResponseText(`🗣️ You said: ${data.recognized}\n\n🤖 Assistant: ${data.response}`);
      if (data.audio) {
        await playAudio(data.audio);
      }
    } catch (err) {
      console.error('Audio upload error:', err);
      Alert.alert('Error', err.message || 'Audio upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = async (audioPath) => {
    if (!audioPath) return;
    
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: `${SERVER_URL}${audioPath}` }
      );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Playback error:', error);
      Alert.alert('Error', 'Audio playback failed');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🌾 Farmer Voice Assistant</Text>

      <TextInput
        style={styles.input}
        placeholder="Type your question..."
        value={textInput}
        onChangeText={setTextInput}
        editable={!isLoading}
      />

      <View style={styles.buttonContainer}>
        <Button 
          title="Send Text" 
          onPress={handleTextSubmit} 
          disabled={isLoading} 
        />
      </View>

      <View style={styles.buttonContainer}>
        {!recording ? (
          <Button 
            title="Start Recording" 
            onPress={startRecording} 
            disabled={isLoading} 
          />
        ) : (
          <Button 
            title="Stop Recording" 
            onPress={stopRecording} 
            disabled={isLoading} 
            color="#FF0000"
          />
        )}
      </View>

      {audioUri && (
        <View style={styles.buttonContainer}>
          <Button 
            title="Send Voice" 
            onPress={uploadAudio} 
            disabled={isLoading} 
          />
        </View>
      )}

      {isLoading && <ActivityIndicator size="large" color="#006400" />}

      {responseText ? (
        <View style={styles.responseBox}>
          <Text style={styles.responseText}>{responseText}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#f5f5f5',
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#006400',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    marginBottom: 15,
  },
  responseBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderColor: '#ddd',
    borderWidth: 1,
    marginTop: 20,
  },
  responseText: {
    fontSize: 16,
    color: '#333',
  },
});
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

const SERVER_URL = 'http://10.3.3.111:5000';

export default function VoiceAssistant() {
  const [textInput, setTextInput] = useState('');
  const [responseText, setResponseText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecordedPlaying, setIsRecordedPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const soundRef = useRef(null);

  // Stop any audio (recorded or backend)
  const stopAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
      setIsPlaying(false);
      setIsRecordedPlaying(false);
    }
  };

  // Play backend audio
  const playAudio = async (audioPath) => {
    if (!audioPath) return;
    try {
      await stopAudio();
      const { sound } = await Audio.Sound.createAsync(
        { uri: `${SERVER_URL}${audioPath}` },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setIsPlaying(true);
      setIsPaused(false);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
          soundRef.current = null;
          setIsPlaying(false);
          setIsPaused(false);
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Audio playback failed');
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  // Play recorded audio
  const playRecordedAudio = async () => {
    if (!audioUri) return;
    try {
      await stopAudio();
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setIsRecordedPlaying(true);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
          soundRef.current = null;
          setIsRecordedPlaying(false);
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Audio playback failed');
      setIsRecordedPlaying(false);
    }
  };

  const handleTextSubmit = async () => {
    await stopAudio();
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
      Alert.alert('Error', err.message || 'Failed to process text');
    } finally {
      setIsLoading(false);
    }
  };

  // Audio Recording Functions
  const startRecording = async () => {
    await stopAudio();
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
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const discardRecording = async () => {
    await stopAudio();
    setAudioUri(null);
    setIsRecordedPlaying(false);
  };

  const uploadAudio = async () => {
    if (!audioUri) return;
    await stopAudio();
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
      setAudioUri(null); // Optionally clear after sending
    } catch (err) {
      Alert.alert('Error', err.message || 'Audio upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  const pauseAudio = async () => {
    if (soundRef.current && isPlaying && !isPaused) {
      await soundRef.current.pauseAsync();
      setIsPaused(true);
    }
  };

  const resumeAudio = async () => {
    if (soundRef.current && isPlaying && isPaused) {
      await soundRef.current.playAsync();
      setIsPaused(false);
    }
  };

  // Stop audio when component unmounts
  React.useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>🌾 Farmer Voice Assistant</Text>

        <Text style={styles.sectionLabel}>Ask by Text</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type your question..."
            value={textInput}
            onChangeText={setTextInput}
            editable={!isLoading}
            placeholderTextColor="#a5d6a7"
          />
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={handleTextSubmit}
            disabled={isLoading}
          >
            <Ionicons name="send" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Or Use Your Voice</Text>
        <View style={styles.voiceRow}>
          {!recording ? (
            <TouchableOpacity
              style={[styles.voiceBtn, { backgroundColor: "#388e3c" }]}
              onPress={startRecording}
              disabled={isLoading}
            >
              <Ionicons name="mic" size={28} color="#fff" />
              <Text style={styles.voiceBtnText}>Start Recording</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.voiceBtn, { backgroundColor: "#d32f2f" }]}
              onPress={stopRecording}
              disabled={isLoading}
            >
              <Ionicons name="stop" size={28} color="#fff" />
              <Text style={styles.voiceBtnText}>Stop</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Recorded Audio Controls */}
        {audioUri && (
          <View style={styles.audioPlayer}>
            <Text style={styles.audioLabel}>🎤 Recorded Audio</Text>
            <View style={styles.audioControls}>
              <TouchableOpacity onPress={playRecordedAudio} disabled={isRecordedPlaying}>
                <Ionicons name="play-circle" size={36} color={isRecordedPlaying ? "#aaa" : "#388e3c"} />
              </TouchableOpacity>
              <TouchableOpacity onPress={stopAudio} disabled={!isRecordedPlaying}>
                <Ionicons name="stop-circle" size={36} color={!isRecordedPlaying ? "#aaa" : "#d32f2f"} />
              </TouchableOpacity>
              <TouchableOpacity onPress={discardRecording}>
                <Ionicons name="close-circle" size={36} color="#888" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendVoiceBtn, isRecordedPlaying && { backgroundColor: "#ccc" }]}
                onPress={uploadAudio}
                disabled={isLoading || isRecordedPlaying}
              >
                <Ionicons name="cloud-upload" size={24} color="#fff" />
                <Text style={styles.sendVoiceBtnText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isPlaying && (
          <View style={styles.audioPlayer}>
            <Text style={styles.audioLabel}>🔊 Playing Response</Text>
            <View style={styles.audioControls}>
              {!isPaused ? (
                <TouchableOpacity style={styles.pauseBtn} onPress={pauseAudio}>
                  <Ionicons name="pause" size={24} color="#fff" />
                  <Text style={styles.stopRespBtnText}>Pause</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.pauseBtn} onPress={resumeAudio}>
                  <Ionicons name="play" size={24} color="#fff" />
                  <Text style={styles.stopRespBtnText}>Resume</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.stopRespBtn} onPress={stopAudio}>
                <Ionicons name="stop" size={24} color="#fff" />
                <Text style={styles.stopRespBtnText}>Stop</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isLoading && <ActivityIndicator size="large" color="#388e3c" style={{ marginTop: 16 }} />}

        {responseText ? (
          <View style={styles.responseBox}>
            <Text style={styles.responseText}>{responseText}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    backgroundColor: '#e8f5e9',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    width: "100%",
    maxWidth: 420,
    marginTop: 30,
    marginBottom: 30,
    shadowColor: "#388e3c",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: "#388e3c",
    marginBottom: 18,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  sectionLabel: {
    fontSize: 15,
    color: "#388e3c",
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 6,
    marginLeft: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  input: {
    flex: 1,
    borderColor: '#a5d6a7',
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#f9fff9',
    fontSize: 16,
    color: "#222",
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: "#388e3c",
    borderRadius: 10,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  voiceRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  voiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    elevation: 2,
    marginHorizontal: 4,
  },
  voiceBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  audioPlayer: {
    backgroundColor: '#f1f8e9',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: "#388e3c",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  audioLabel: {
    fontSize: 15,
    color: "#388e3c",
    fontWeight: "bold",
    marginBottom: 6,
  },
  audioControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  sendVoiceBtn: {
    backgroundColor: "#388e3c",
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  sendVoiceBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 6,
  },
  stopRespBtn: {
    backgroundColor: "#d32f2f",
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  stopRespBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 6,
  },
  pauseBtn: {
    backgroundColor: "#fbc02d",
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginRight: 8,
  },
  responseBox: {
    backgroundColor: '#e8f5e9',
    padding: 16,
    borderRadius: 12,
    borderColor: '#a5d6a7',
    borderWidth: 1,
    marginTop: 22,
    marginBottom: 8,
    shadowColor: "#388e3c",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  responseText: {
    fontSize: 17,
    color: '#222',
    lineHeight: 24,
  },
});
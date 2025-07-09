import React, { useState } from "react";
import { View, Text, StyleSheet, Button, Image, ActivityIndicator, Alert, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function DiseaseDiagnosis() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [medication, setMedication] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
      setResult(null);
      setConfidence(null);
      setMedication(null);
    }
  };

  const uploadImage = async () => {
    if (!image) return;
    setLoading(true);
    let formData = new FormData();
    formData.append("image", {
      uri: image,
      name: "photo.jpg",
      type: "image/jpeg",
    });

    try {
      const response = await fetch("http://10.3.3.111:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });
      const data = await response.json();
      setResult(data.predicted_class || "No result");
      setConfidence(data.confidence ? `${data.confidence}%` : null);
      setMedication(data.medication || null);
    } catch (e) {
      Alert.alert("Upload failed", e.message);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={styles.card}>
        <Text style={styles.title}>🩺 Disease Diagnosis + Medication</Text>
        <Text style={styles.desc}>Upload a plant leaf image to detect disease and get medication suggestions.</Text>
        <Button title="Pick Image from Gallery" onPress={pickImage} />
        {image && (
          <>
            <Image source={{ uri: image }} style={styles.image} />
            <Button title="Upload & Diagnose" onPress={uploadImage} disabled={loading} />
          </>
        )}
        {loading && <ActivityIndicator style={{ marginTop: 10 }} />}
        {result && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.result}>Disease: {result}</Text>
            {confidence && <Text style={styles.confidence}>Confidence: {confidence}</Text>}
            {medication && (
              <View style={styles.medicationBox}>
                <Text style={styles.medicationTitle}>Medication Advice:</Text>
                <Text style={styles.medicationText}>{medication}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#388e3c",
    marginBottom: 6,
  },
  desc: {
    color: "#555",
    marginBottom: 10,
  },
  image: {
    width: 180,
    height: 180,
    marginVertical: 10,
    borderRadius: 10,
    alignSelf: "center",
  },
  result: {
    fontSize: 17,
    marginTop: 8,
    color: "#388e3c",
    fontWeight: "bold",
  },
  confidence: {
    fontSize: 15,
    color: "#555",
    marginTop: 4,
    marginBottom: 8,
  },
  medicationBox: {
    backgroundColor: "#e8f5e9",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  medicationTitle: {
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: 4,
  },
  medicationText: {
    color: "#333",
    fontSize: 15,
  },
});
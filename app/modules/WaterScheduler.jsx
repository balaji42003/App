import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";

export default function WaterScheduler() {
  // States for both features
  const [activeTab, setActiveTab] = useState("schedule");
  
  // Water scheduling states
  const [crops, setCrops] = useState([
    { crop_name: "", crop_stage: "", season: "", acres: "", last_watered_date: "" },
  ]);
  const [borewells, setBorewells] = useState("2");
  const [scheduleResult, setScheduleResult] = useState(null);
  
  // Prediction/feasibility states
  const [predictionCrops, setPredictionCrops] = useState([
    { crop_name: "", crop_stage: "", season: "", acres: "" },
  ]);
  const [predictionBorewells, setPredictionBorewells] = useState("1");
  const [predictionResult, setPredictionResult] = useState(null);

  // Common functions
  const handleInputChange = (index, field, value, isPrediction = false) => {
    const updateFunction = isPrediction ? setPredictionCrops : setCrops;
    const currentCrops = isPrediction ? [...predictionCrops] : [...crops];
    
    currentCrops[index][field] = value;
    updateFunction(currentCrops);
  };

  const addCrop = (isPrediction = false) => {
    const updateFunction = isPrediction ? setPredictionCrops : setCrops;
    const template = isPrediction 
      ? { crop_name: "", crop_stage: "", season: "", acres: "" }
      : { crop_name: "", crop_stage: "", season: "", acres: "", last_watered_date: "" };
    
    updateFunction(prev => [...prev, template]);
  };

  // API calls
  const submitSchedule = async () => {
    try {
      const payload = {
        borewells: parseInt(borewells),
        crops: crops.map((c) => ({
          ...c,
          acres: parseFloat(c.acres),
        })),
      };

      const response = await fetch("http://localhost:5000/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setScheduleResult(data);
    } catch (err) {
      Alert.alert("❌ Error", "Failed to fetch schedule. Check Flask server or URL.");
    }
  };

  const submitPrediction = async () => {
    try {
      const payload = {
        borewells: parseInt(predictionBorewells),
        crops: predictionCrops.map((c) => ({
          crop_name: c.crop_name,
          crop_stage: c.crop_stage,
          season: c.season,
          acres: parseFloat(c.acres),
        })),
      };

      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setPredictionResult(data);
    } catch (err) {
      Alert.alert("❌ Error", "Failed to fetch prediction. Check Flask server or URL.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>🌾 Farm Management</Text>
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "schedule" && styles.activeTab]}
          onPress={() => setActiveTab("schedule")}
        >
          <Text style={styles.tabText}>💧 Water Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "predict" && styles.activeTab]}
          onPress={() => setActiveTab("predict")}
        >
          <Text style={styles.tabText}>🔍 Crop Feasibility</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "schedule" ? (
        <>
          <Text style={styles.label}>No. of Borewells</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={borewells}
            onChangeText={setBorewells}
          />

          {crops.map((crop, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.subHeader}>Crop {index + 1}</Text>
              {["crop_name", "crop_stage", "season", "acres", "last_watered_date"].map((field) => (
                <TextInput
                  key={field}
                  style={styles.input}
                  placeholder={field.replace(/_/g, " ")}
                  keyboardType={field === "acres" ? "numeric" : "default"}
                  value={crop[field]}
                  onChangeText={(value) => handleInputChange(index, field, value)}
                />
              ))}
            </View>
          ))}

          <Button title="➕ Add Another Crop" onPress={() => addCrop(false)} color="#388e3c" />
          <View style={{ marginTop: 12 }}>
            <Button title="🚀 Generate Schedule" onPress={submitSchedule} color="#00695c" />
          </View>

          {scheduleResult && (
            <View style={styles.output}>
              <Text style={styles.outputHeader}>📋 Schedule:</Text>
              {scheduleResult.schedule ? (
                scheduleResult.schedule.map((bore, i) => (
                  <View key={i}>
                    <Text style={styles.boldText}>Borewell {bore.borewell} - ⏱ {bore.total_time} mins</Text>
                    {bore.crops.map((c, j) => (
                      <Text key={j} style={styles.cropLine}>
                        • {c.crop_name} ({c.crop_stage} - {c.season}) - {c.acres} acre(s) → {c.total_time} mins
                      </Text>
                    ))}
                  </View>
                ))
              ) : (
                <Text style={{ color: "red" }}>{scheduleResult.message}</Text>
              )}
            </View>
          )}
        </>
      ) : (
        <>
          <Text style={styles.label}>No. of Borewells</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={predictionBorewells}
            onChangeText={setPredictionBorewells}
          />

          {predictionCrops.map((crop, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.subHeader}>Crop {index + 1}</Text>
              {["crop_name", "crop_stage", "season", "acres"].map((field) => (
                <TextInput
                  key={field}
                  style={styles.input}
                  placeholder={field.replace(/_/g, " ")}
                  keyboardType={field === "acres" ? "numeric" : "default"}
                  value={crop[field]}
                  onChangeText={(value) => handleInputChange(index, field, value, true)}
                />
              ))}
            </View>
          ))}

          <Button title="➕ Add Another Crop" onPress={() => addCrop(true)} color="#388e3c" />
          <View style={{ marginTop: 12 }}>
            <Button title="🔍 Check Feasibility" onPress={submitPrediction} color="#00695c" />
          </View>

          {predictionResult && (
            <View style={styles.output}>
              <Text style={styles.outputHeader}>📋 Feasibility Result:</Text>
              {predictionResult.message && (
                <Text style={predictionResult.status === "Feasible" ? styles.successText : styles.warningText}>
                  {predictionResult.message}
                </Text>
              )}
              
              {predictionResult.total_time_needed && (
                <>
                  <Text style={styles.boldText}>Total Watering Time Needed: {predictionResult.total_time_needed} mins</Text>
                  <Text>Available Capacity: {predictionResult.available_capacity} mins</Text>
                </>
              )}
              
              {predictionResult.extra_minutes_needed && (
                <Text>Additional Capacity Needed: {predictionResult.extra_minutes_needed} mins</Text>
              )}
              
              {predictionResult.suggested_borewells && (
                <Text>Suggested Borewells: {predictionResult.suggested_borewells}</Text>
              )}
              
              {predictionResult.crops && (
                <>
                  <Text style={styles.boldText}>Crop Details:</Text>
                  {predictionResult.crops.map((crop, i) => (
                    <Text key={i} style={styles.cropLine}>
                      • {crop.crop_name}: {crop.acres} acres, {crop.total_time} mins
                    </Text>
                  ))}
                </>
              )}
              
              {predictionResult.invalid_crops && predictionResult.invalid_crops.length > 0 && (
                <>
                  <Text style={styles.boldText}>Invalid Crops:</Text>
                  {predictionResult.invalid_crops.map((crop, i) => (
                    <Text key={i} style={styles.cropLine}>• {crop}</Text>
                  ))}
                </>
              )}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f2fef4",
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1b5e20",
    marginBottom: 10,
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  tab: {
    padding: 10,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
  },
  activeTab: {
    backgroundColor: "#a5d6a7",
  },
  tabText: {
    fontWeight: "bold",
  },
  subHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4caf50",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginVertical: 8,
    elevation: 2,
  },
  label: {
    fontWeight: "bold",
    marginTop: 8,
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    marginVertical: 6,
    padding: 8,
    borderRadius: 6,
  },
  output: {
    marginTop: 20,
    padding: 14,
    backgroundColor: "#e8f5e9",
    borderRadius: 8,
  },
  outputHeader: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  boldText: {
    fontWeight: "bold",
    marginTop: 6,
  },
  successText: {
    color: "#2e7d32",
    fontWeight: "bold",
  },
  warningText: {
    color: "#d32f2f",
    fontWeight: "bold",
  },
  cropLine: {
    marginLeft: 10,
    fontSize: 13,
  },
});
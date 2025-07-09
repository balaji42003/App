import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import farmLogo from "../assets/farm-logo.jpg"; // Make sure this path matches your file location

const features = [
  { name: "Disease Diagnosis", route: "modules/DiseaseDiagnosis", icon: "🩺" },
  { name: "Voice Assistant", route: "modules/VoiceAssistant", icon: "💬" },
  { name: "Crop Cost Estimator", route: "modules/CropCostEstimator", icon: "💰" },
  { name: "Water Scheduler", route: "modules/WaterScheduler", icon: "💧" },
  { name: "Motor Control", route: "modules/MotorControlPanel", icon: "🔌" },
];

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🌱 Smart Agriculture Platform</Text>
      <View style={styles.logoRow}>
        <Image
          source={farmLogo}
          style={styles.logoWide}
          resizeMode="cover"
        />
      </View>
      <View style={styles.grid}>
        {features.map((f) => (
          <TouchableOpacity
            key={f.route}
            style={styles.card}
            onPress={() => router.push(`/${f.route}`)}
          >
            <Text style={styles.icon}>{f.icon}</Text>
            <Text style={styles.label}>{f.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e8f5e9", padding: 16 },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#388e3c",
    marginVertical: 20,
    textAlign: "center",
  },
  logoRow: {
    width: "100%",
    alignItems: "center",
    marginBottom: 18,
  },
  logoWide: {
    width: "97%",
    height: 200,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#a5d6a7",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.13,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 6,
    // To make it visually cover two cards' width
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "47%",
    aspectRatio: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  icon: { fontSize: 36, marginBottom: 8 },
  label: { fontSize: 15, color: "#388e3c", fontWeight: "600", textAlign: "center" },
});

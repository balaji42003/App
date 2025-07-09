import { View, Text, StyleSheet } from "react-native";
export default function CropCostEstimator() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>💰 Crop Cost Estimator</Text>
      <Text style={styles.desc}>Input crop, area, and location to estimate costs.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#388e3c",
    marginBottom: 6,
  },
  desc: {
    color: "#555",
  },
});
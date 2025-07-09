import { View, Text, StyleSheet } from "react-native";
export default function MotorControlPanel() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>🔌 IoT Motor Control Panel</Text>
      <Text style={styles.desc}>Toggle water motor ON/OFF or view scheduled activations.</Text>
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
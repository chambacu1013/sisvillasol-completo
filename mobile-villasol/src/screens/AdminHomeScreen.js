import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Usamos íconos bonitos
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AdminHomeScreen({ navigation }) {
  const logout = async () => {
    try {
      // 1. Borramos SOLO la sesión actual
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("usuario");
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      console.error("Error al salir:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panel Administrador</Text>
      <Text style={styles.subtitle}>Finca Villasol</Text>

      {/* Botón 1: Inventario de Insumos */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("AgregarInsumo")}
      >
        <Ionicons name="cube-outline" size={50} color="#2E7D32" />
        <Text style={styles.cardText}>Agregar Insumos</Text>
        <Text style={styles.cardSubtext}>
          Registrar compras (Daconil, Abono...)
        </Text>
      </TouchableOpacity>

      {/* Botón 2: Historial de Actividades */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("HistorialGlobal")}
      >
        <Ionicons name="list-outline" size={50} color="#1565C0" />
        <Text style={styles.cardText}>Historial de Actividades</Text>
        <Text style={styles.cardSubtext}>
          Ver qué han hecho los agricultores
        </Text>
      </TouchableOpacity>

      {/* Botón Salir */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2E7D32",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
  },
  card: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 20,
    elevation: 5, // Sombra en Android
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardText: { fontSize: 20, fontWeight: "bold", marginTop: 10, color: "#333" },
  cardSubtext: { fontSize: 14, color: "#888", textAlign: "center" },
  logoutButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#d32f2f",
    borderRadius: 10,
    alignItems: "center",
  },
  logoutText: { color: "white", fontWeight: "bold", fontSize: 16 },
});

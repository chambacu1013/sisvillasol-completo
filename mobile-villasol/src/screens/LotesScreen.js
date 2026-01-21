import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import api from "../services/api";

export default function LotesScreen() {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarLotes();
  }, []);

  const cargarLotes = async () => {
    try {
      const userJson = await AsyncStorage.getItem("usuario");
      const user = userJson ? JSON.parse(userJson) : null;
      const userId = user?.id_usuario || user?.id;
      const res = await api.get("/actividades/info-lotes");

      let listaLotes = res.data;
      // 🛑 FILTRO FRANKLIN (ID 5)
      // Si es Franklin, SOLO mostramos el Lote 9
      if (Number(userId) === 5) {
        listaLotes = listaLotes.filter((l) =>
          l.nombre_lote.toLowerCase().includes("lote 9"),
        );
      }

      setLotes(listaLotes);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo cargar la información de lotes");
    } finally {
      setLoading(false);
    }
  };

  // Función para elegir color según estado sanitario
  const getEstadoColor = (estado) => {
    switch (estado) {
      case "OPTIMO":
        return "#2e7d32"; // Verde
      case "EN_TRATAMIENTO":
        return "#ff9800"; // Naranja
      case "CUARENTENA":
        return "#d32f2f"; // Rojo
      default:
        return "#757575"; // Gris
    }
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.card,
        { borderTopColor: getEstadoColor(item.estado_sanitario) },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <FontAwesome5
            name="seedling"
            size={20}
            color={getEstadoColor(item.estado_sanitario)}
          />
          <Text style={styles.loteName}>{item.nombre_lote}</Text>
        </View>
        <View
          style={[
            styles.badge,
            { backgroundColor: getEstadoColor(item.estado_sanitario) },
          ]}
        >
          <Text style={styles.badgeText}>{item.estado_sanitario}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.variedad}>{item.nombre_variedad}</Text>
        <Text style={styles.cientifico}>🔬 {item.nombre_cientifico}</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <MaterialIcons name="aspect-ratio" size={18} color="#555" />
            <Text style={styles.infoText}>{item.area_hectareas} Ha</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="timer" size={18} color="#555" />
            <Text style={styles.infoText}>
              {item.dias_estimados_cosecha} días cosecha
            </Text>
          </View>
        </View>

        <Text style={styles.ubicacion}>
          📍 Coords: {item.ubicacion || "No registrada"}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Inventario de Cultivos</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#1b5e20" />
      ) : (
        <FlatList
          data={lotes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id_lote.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 20 },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1b5e20",
    marginBottom: 15,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
    borderTopWidth: 5,
    padding: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  titleContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
  loteName: { fontSize: 20, fontWeight: "bold", color: "#333" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: "white", fontSize: 10, fontWeight: "bold" },
  body: { gap: 5 },
  variedad: { fontSize: 18, fontWeight: "600", color: "#1b5e20" },
  cientifico: { fontStyle: "italic", color: "#757575", marginBottom: 5 },
  infoRow: { flexDirection: "row", gap: 20, marginVertical: 8 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  infoText: { fontWeight: "500", color: "#444" },
  ubicacion: { fontSize: 11, color: "#9e9e9e", marginTop: 5 },
});

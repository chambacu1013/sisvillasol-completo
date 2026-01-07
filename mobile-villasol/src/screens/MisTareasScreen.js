import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native"; // Para recargar al volver
import api from "../services/api";

export default function MisTareasScreen({ navigation }) {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabActual, setTabActual] = useState("PENDIENTE"); // 'PENDIENTE' o 'HECHO'
  const [usuario, setUsuario] = useState(null);

  // useFocusEffect hace que se recargue la lista cada vez que volvemos a esta pantalla
  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [])
  );
  const formatearFechaLocal = (fechaString) => {
    if (!fechaString) return "Fecha no disponible";

    // Asegurarnos de tomar solo la parte YYYY-MM-DD si viene con hora
    const soloFecha = fechaString.split("T")[0];

    // Dividimos "2026-01-04" en [2026, 01, 04]
    const [anio, mes, dia] = soloFecha.split("-");

    // Creamos la fecha en hora LOCAL (Mes en JS es índice 0, por eso restamos 1)
    const fecha = new Date(anio, mes - 1, dia);

    // Opciones para que se vea bonito en español (ej: "4 ene 2026")
    return fecha.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short", // o 'long' para el nombre completo
      year: "numeric",
    });
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const userJson = await AsyncStorage.getItem("usuario");
      if (!userJson) return;
      const user = JSON.parse(userJson);
      const userId = user.id || user.id_usuario;
      setUsuario(user);

      const response = await api.get("/actividades");

      // Filtramos SOLO las del usuario
      const misTareas = response.data.filter(
        (t) => Number(t.id_usuario_asignado) === Number(userId)
      );
      setTareas(misTareas);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Filtramos según la pestaña seleccionada
  const tareasFiltradas = tareas.filter((t) => t.estado === tabActual);

  const renderItem = ({ item }) => (
    // Al presionar, vamos al DETALLE
    <TouchableOpacity
      style={[styles.card, item.estado === "HECHO" && styles.cardHecho]}
      onPress={() => navigation.navigate("DetalleTarea", { tarea: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.tipoActividad}>
          {item.nombre_tipo_actividad || "Actividad"}
        </Text>
        {/* Flechita para indicar que se puede abrir */}
        <MaterialIcons name="chevron-right" size={24} color="#ccc" />
      </View>

      <Text style={styles.lote}>
        📍 {item.nombre_lote} -{" "}
        <Text style={{ fontWeight: "bold" }}>
          {item.nombre_variedad || "Sin Cultivo"}
        </Text>
      </Text>
      <Text style={styles.fecha}>
        📅 {formatearFechaLocal(item.fecha_programada)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* PESTAÑAS / TABS SUPERIORES */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, tabActual === "PENDIENTE" && styles.tabActivo]}
          onPress={() => setTabActual("PENDIENTE")}
        >
          <Text
            style={[
              styles.tabTexto,
              tabActual === "PENDIENTE" && styles.tabTextoActivo,
            ]}
          >
            PENDIENTES
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tabActual === "HECHO" && styles.tabActivo]}
          onPress={() => setTabActual("HECHO")}
        >
          <Text
            style={[
              styles.tabTexto,
              tabActual === "HECHO" && styles.tabTextoActivo,
            ]}
          >
            TERMINADAS
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#1b5e20"
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          data={tareasFiltradas}
          renderItem={renderItem}
          keyExtractor={(item) => item.id_tarea.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 50 }}>
              <MaterialIcons
                name={
                  tabActual === "PENDIENTE" ? "assignment-turned-in" : "history"
                }
                size={60}
                color="#ccc"
              />
              <Text style={styles.vacio}>
                {tabActual === "PENDIENTE"
                  ? "¡Estás al día! No hay pendientes."
                  : "No hay tareas finalizadas aún."}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabActivo: { borderBottomColor: "#1b5e20" },
  tabTexto: { color: "#888", fontWeight: "bold" },
  tabTextoActivo: { color: "#1b5e20" },

  card: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: 15,
    elevation: 2,
    borderLeftWidth: 5,
    borderLeftColor: "#fbc02d",
  },
  cardHecho: { borderLeftColor: "#2e7d32", opacity: 0.8 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  tipoActividad: { fontSize: 18, fontWeight: "bold", color: "#333" },
  lote: { fontSize: 16, color: "#555", marginTop: 5 },
  fecha: { fontSize: 14, color: "#777", marginBottom: 5 },
  vacio: { textAlign: "center", marginTop: 20, fontSize: 16, color: "#999" },
});

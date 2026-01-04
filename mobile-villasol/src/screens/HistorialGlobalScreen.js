import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";

export default function HistorialGlobalScreen({ navigation }) {
  const [actividades, setActividades] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);

  useEffect(() => {
    cargarHistorial();
  }, []);

  // Función para refrescar la lista (puedes llamar esto al deslizar hacia abajo)
  const cargarHistorial = async () => {
    try {
      // Asegúrate que esta ruta coincida con tu backend
      const response = await api.get("/actividades/historial");
      setActividades(response.data);
    } catch (error) {
      console.error("Error cargando historial", error);
    }
  };

  const abrirDetalles = (item) => {
    setTareaSeleccionada(item);
    setModalVisible(true);
  };

  // Función auxiliar para dar color al estado
  const getColorEstado = (estado) => {
    if (estado === "HECHO") return "#2E7D32"; // Verde
    if (estado === "EN_PROCESO") return "#F9A825"; // Amarillo oscuro
    return "#C62828"; // Rojo (Pendiente)
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "Sin fecha";
    return new Date(fecha).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => abrirDetalles(item)}>
      <View style={styles.headerCard}>
        <Text style={styles.tipoActividad}>{item.nombre_tipo_actividad}</Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: getColorEstado(item.estado) },
          ]}
        >
          <Text style={styles.badgeText}>{item.estado}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <Ionicons name="person-outline" size={16} color="#666" />
        <Text style={styles.infoText}> {item.nombre_agricultor}</Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="leaf-outline" size={16} color="#666" />
        <Text style={styles.infoText}>
          {" "}
          {item.nombre_lote} - {item.nombre_variedad}
        </Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="calendar-outline" size={16} color="#666" />
        <Text style={styles.dateText}>
          {" "}
          Prog: {formatearFecha(item.fecha_programada)}
        </Text>
      </View>
    </TouchableOpacity>
  );
  // Función para traducir el código de jornada a texto amigable
  const formatearJornada = (jornada) => {
    switch (jornada) {
      case "MANANA":
        return "🌅 Mañana (Media Jornada)";
      case "TARDE":
        return "🌇 Tarde (Media Jornada)";
      case "COMPLETA":
        return "☀️ Jornada Completa";
      default:
        return "☀️ Jornada Completa"; // Valor por defecto
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={28} color="#1B5E20" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bitácora de Campo</Text>
      </View>
      {/* ----------------------------------- */}

      <FlatList
        data={actividades}
        keyExtractor={(item) => item.id_tarea.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* MODAL DE DETALLES */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {tareaSeleccionada && (
              <ScrollView>
                <Text style={styles.modalTitle}>Detalles de Actividad</Text>

                {/* 1. Descripción */}
                <Text style={styles.label}>📝 Descripción:</Text>
                <Text style={styles.descText}>
                  {tareaSeleccionada.descripcion || "Sin descripción"}
                </Text>

                <View style={styles.divider} />

                {/* 2. Fechas (Lógica condicional) */}
                <Text style={styles.label}>📅 Fecha Programada:</Text>
                <Text style={styles.valueText}>
                  {formatearFecha(tareaSeleccionada.fecha_programada)}
                </Text>

                {tareaSeleccionada.estado === "HECHO" && (
                  <>
                    {/* --- NUEVO BLOQUE DE JORNADA --- */}
                    <Text
                      style={[
                        styles.label,
                        { marginTop: 10, color: "#2E7D32" },
                      ]}
                    >
                      🕒 Jornada Laborada:
                    </Text>
                    <Text
                      style={[
                        styles.valueText,
                        { fontWeight: "bold", color: "#333" },
                      ]}
                    >
                      {formatearJornada(tareaSeleccionada.jornada)}
                    </Text>
                    {/* ------------------------------- */}
                  </>
                )}

                <View style={styles.divider} />

                {/* 3. Insumos Consumidos (Solo si está HECHO y usó insumos) */}
                {tareaSeleccionada.estado === "HECHO" &&
                tareaSeleccionada.insumos_usados &&
                tareaSeleccionada.insumos_usados.length > 0 ? (
                  <View style={styles.insumosContainer}>
                    <Text style={styles.label}>🧪 Insumos Aplicados:</Text>
                    {tareaSeleccionada.insumos_usados.map((insumo, index) => (
                      <View key={index} style={styles.insumoItem}>
                        <Ionicons name="flask" size={18} color="#2E7D32" />
                        <Text style={styles.insumoText}>
                          {insumo.nombre}:{" "}
                          <Text style={{ fontWeight: "bold" }}>
                            {insumo.cantidad} {insumo.unidad}
                          </Text>
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  tareaSeleccionada.estado === "HECHO" && (
                    <Text
                      style={{
                        fontStyle: "italic",
                        color: "#888",
                        marginTop: 10,
                      }}
                    >
                      No se registraron insumos en esta tarea.
                    </Text>
                  )
                )}

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeText}>CERRAR</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E8F5E9", padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1B5E20",
    marginBottom: 15,
    textAlign: "center",
  },

  // Estilos de la Tarjeta (Lista)
  card: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
  },
  headerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  tipoActividad: { fontSize: 18, fontWeight: "bold", color: "#333" },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: "white", fontSize: 12, fontWeight: "bold" },
  row: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  infoText: { fontSize: 15, color: "#555" },
  dateText: { fontSize: 14, color: "#888", fontStyle: "italic" },

  // Estilos del Modal
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 25,
    elevation: 10,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 15,
    textAlign: "center",
  },
  label: { fontSize: 16, fontWeight: "bold", color: "#333", marginTop: 5 },
  descText: { fontSize: 16, color: "#555", lineHeight: 22, marginTop: 2 },
  valueText: { fontSize: 16, color: "#444" },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 15 },

  // Insumos en Modal
  insumosContainer: {
    backgroundColor: "#F1F8E9",
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
  },
  insumoItem: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  insumoText: { marginLeft: 8, fontSize: 15, color: "#333" },

  closeButton: {
    marginTop: 25,
    backgroundColor: "#1B5E20",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    padding: 15,
    marginRight: 5,
  },
  // El title se ajusta para convivir con la flecha
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1B5E20",
  },
  closeText: { color: "white", fontWeight: "bold", fontSize: 16 },
});

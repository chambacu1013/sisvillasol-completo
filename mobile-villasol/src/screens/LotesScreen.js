import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import Toast from "react-native-toast-message";
import api from "../services/api";

export default function LotesScreen() {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- NUEVOS ESTADOS PARA EL MODAL AGRONÓMICO ---
  const [catalogoEstados, setCatalogoEstados] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loteSeleccionado, setLoteSeleccionado] = useState(null);
  const [clasificacionFiltro, setClasificacionFiltro] = useState("OPTIMO");
  const [idEstadoSeleccionado, setIdEstadoSeleccionado] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarLotes();
    cargarCatalogo();
  }, []);

  const cargarLotes = async () => {
    try {
      const userJson = await AsyncStorage.getItem("usuario");
      const user = userJson ? JSON.parse(userJson) : null;
      const userId = user?.id_usuario || user?.id;
      const res = await api.get("/actividades/info-lotes");

      let listaLotes = res.data;
      // 🛑 FILTRO FRANKLIN (ID 5)
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

  const cargarCatalogo = async () => {
    try {
      const res = await api.get("/lotes/catalogo-estados");
      setCatalogoEstados(res.data);
    } catch (error) {
      console.error("Error cargando catálogo agronómico:", error);
    }
  };

  // Función para elegir color según estado sanitario (Solo Verde y Rojo)
  const getEstadoColor = (clasificacion) => {
    return clasificacion === "ALERTA" ? "#d32f2f" : "#2e7d32";
  };

  const abrirModalEstado = (lote) => {
    setLoteSeleccionado(lote);
    setClasificacionFiltro(lote.estado_sanitario || "OPTIMO");
    setIdEstadoSeleccionado("");
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setLoteSeleccionado(null);
    setIdEstadoSeleccionado("");
  };

  const handleGuardarEstado = async () => {
    if (!idEstadoSeleccionado) {
      Toast.show({
        type: "info",
        text1: "Faltan datos",
        text2: "Debes seleccionar una etapa o problema ⚠️",
      });
      return;
    }

    setGuardando(true);
    try {
      await api.put(`/lotes/estado/${loteSeleccionado.id_lote}`, {
        id_estado_actual: idEstadoSeleccionado,
      });

      Toast.show({
        type: "success",
        text1: "¡Actualizado!",
        text2: "Estado agronómico guardado con éxito 🌱",
      });

      cerrarModal();
      cargarLotes(); // Recargamos la lista para ver los cambios
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo actualizar el estado.",
      });
    } finally {
      setGuardando(false);
    }
  };

  // Filtramos el catálogo dependiendo de si escogió ÓPTIMO o ALERTA
  const estadosFiltrados = catalogoEstados.filter(
    (e) => e.clasificacion === clasificacionFiltro,
  );

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
          <Text style={styles.badgeText}>
            {item.estado_sanitario === "ALERTA" ? "🔴 ALERTA" : "🟢 ÓPTIMO"}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.variedad}>{item.nombre_variedad}</Text>
        <Text style={styles.cientifico}>🔬 {item.nombre_cientifico}</Text>

        {/* INDICADOR DEL ESTADO EXACTO (EJ: FLORACIÓN, MONILIA) */}
        <View style={styles.estadoContainer}>
          <Text style={styles.estadoLabel}>Etapa / Condición Actual:</Text>
          <Text
            style={[
              styles.estadoValor,
              { color: getEstadoColor(item.estado_sanitario) },
            ]}
          >
            {item.nombre_estado || "Desconocida"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <MaterialIcons name="aspect-ratio" size={18} color="#555" />
            <Text style={styles.infoText}>{item.area_hectareas} Ha</Text>
          </View>

          <View style={styles.infoItem}>
            <FontAwesome5 name="tree" size={16} color="#555" />
            <Text style={styles.infoText}>
              {item.cantidad_arboles || 0} árboles
            </Text>
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

        {/* BOTÓN PARA ABRIR MODAL */}
        <TouchableOpacity
          style={[
            styles.btnActualizar,
            { backgroundColor: getEstadoColor(item.estado_sanitario) },
          ]}
          onPress={() => abrirModalEstado(item)}
        >
          <MaterialIcons name="update" size={20} color="white" />
          <Text style={styles.btnActualizarText}>Cambiar Estado</Text>
        </TouchableOpacity>
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

      {/* --- MODAL PARA ACTUALIZAR ESTADO AGRONÓMICO --- */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={cerrarModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View
              style={[
                styles.modalHeader,
                {
                  backgroundColor:
                    clasificacionFiltro === "OPTIMO" ? "#2e7d32" : "#d32f2f",
                },
              ]}
            >
              <Text style={styles.modalTitle}>Actualizar Estado</Text>
            </View>

            <View style={{ padding: 20 }}>
              <Text style={{ fontSize: 16, marginBottom: 15, color: "#333" }}>
                Lote:{" "}
                <Text style={{ fontWeight: "bold" }}>
                  {loteSeleccionado?.nombre_lote}
                </Text>
              </Text>

              {/* 1. SELECT CONDICIÓN GENERAL */}
              <Text style={styles.label}>Condición General:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={clasificacionFiltro}
                  onValueChange={(val) => {
                    setClasificacionFiltro(val);
                    setIdEstadoSeleccionado("");
                  }}
                  dropdownIconColor="black"
                  style={{ color: "black" }}
                >
                  <Picker.Item
                    label="🟢 ÓPTIMO (Ciclo Normal)"
                    value="OPTIMO"
                  />
                  <Picker.Item
                    label="🔴 ALERTA (Plagas/Enfermedad)"
                    value="ALERTA"
                  />
                </Picker>
              </View>

              {/* 2. SELECT ETAPA / PROBLEMA EXACTO */}
              <Text style={styles.label}>Seleccionar Etapa o Problema:</Text>
              <View style={[styles.pickerContainer, { marginBottom: 20 }]}>
                <Picker
                  selectedValue={idEstadoSeleccionado}
                  onValueChange={(val) => setIdEstadoSeleccionado(val)}
                  dropdownIconColor="black"
                  style={{ color: "black" }}
                >
                  <Picker.Item label="Seleccione una opción..." value="" />
                  {estadosFiltrados.map((estado) => (
                    <Picker.Item
                      key={estado.id_estado}
                      label={`[${estado.categoria}] - ${estado.nombre_estado}`}
                      value={estado.id_estado}
                    />
                  ))}
                </Picker>
              </View>

              <View style={styles.botonesContainer}>
                <TouchableOpacity
                  style={[styles.btnModal, { backgroundColor: "#757575" }]}
                  onPress={cerrarModal}
                >
                  <Text style={styles.btnModalText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.btnModal,
                    {
                      backgroundColor:
                        clasificacionFiltro === "OPTIMO"
                          ? "#2e7d32"
                          : "#d32f2f",
                    },
                  ]}
                  onPress={handleGuardarEstado}
                  disabled={guardando}
                >
                  {guardando ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.btnModalText}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  estadoContainer: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  estadoLabel: { fontSize: 12, color: "#666", fontWeight: "bold" },
  estadoValor: { fontSize: 16, fontWeight: "bold", marginTop: 2 },
  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
    marginVertical: 8,
  },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  infoText: { fontWeight: "500", color: "#444" },
  ubicacion: { fontSize: 11, color: "#9e9e9e", marginTop: 5 },
  btnActualizar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 15,
    gap: 8,
  },
  btnActualizarText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    width: "90%",
    borderRadius: 15,
    overflow: "hidden",
    elevation: 5,
  },
  modalHeader: {
    padding: 15,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 15,
  },
  botonesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  btnModal: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  btnModalText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

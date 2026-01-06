import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import api from "../services/api";
import Toast from "react-native-toast-message";

export default function DetalleTareaScreen({ route, navigation }) {
  // Estados
  const [modalVisible, setModalVisible] = useState(false);
  const [listaInsumos, setListaInsumos] = useState([]);
  const [insumosSeleccionados, setInsumosSeleccionados] = useState([]);

  // Estados del Formulario Modal
  const [cantidadInput, setCantidadInput] = useState("");
  const [insumoTemporal, setInsumoTemporal] = useState(null);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState("");
  // Estado Jornada
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState("COMPLETA");
  // Estado Fecha
  const [fechaEjecucion, setFechaEjecucion] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [insumos, setInsumos] = useState([]);

  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [insumoAEditar, setInsumoAEditar] = useState(null);
  const [nuevaCantidad, setNuevaCantidad] = useState("");

  const { tarea } = route.params || {};

  if (!tarea) {
    return (
      <View style={styles.container}>
        <Text>Cargando tarea...</Text>
      </View>
    );
  }
  useEffect(() => {
    if (tarea?.estado === "HECHO") {
      cargarInsumosUsados();
    }
  }, [tarea]);

  const cargarInsumosUsados = async () => {
    try {
      // Usamos LA MISMA RUTA que arreglamos en el backend hace un momento
      const res = await api.get(`/actividades/insumos-tarea/${tarea.id_tarea}`);
      setInsumos(res.data);
    } catch (error) {
      console.log("Error cargando insumos:", error);
    }
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFechaEjecucion(selectedDate);
    }
  };

  useEffect(() => {
    if (tarea?.estado === "PENDIENTE") {
      cargarInsumosBodega();
    }
  }, [tarea]);

  const cargarInsumosBodega = async () => {
    try {
      const res = await api.get("/insumos");
      const categoriasConsumibles = [
        "Fungicida",
        "Insecticida",
        "Fertilizante",
        "Regulador",
        "Herbicida",
      ];
      const insumosFiltrados = res.data.filter((item) =>
        categoriasConsumibles.includes(item.nombre_categoria)
      );
      setListaInsumos(insumosFiltrados);
    } catch (error) {
      console.error("Error cargando bodega", error);
    }
  };

  // Abrir el modal de edición para un insumo ya usado
  const abrirEdicion = (insumo) => {
    setInsumoAEditar(insumo);
    setNuevaCantidad(
      (insumo.cantidad_usada || insumo.cantidad || 0).toString()
    );
    setModalEditarVisible(true);
  };

  // Guardar edición de cantidad de insumo usado (disponible globalmente)
  const guardarEdicionInsumo = async () => {
    if (!nuevaCantidad || isNaN(nuevaCantidad)) {
      Alert.alert("Error", "Ingresa una cantidad válida");
      return;
    }

    try {
      await api.put(
        `/actividades/insumos-tarea/${insumoAEditar.id_insumo_tarea}`,
        {
          cantidad: parseFloat(nuevaCantidad),
          id_insumo: insumoAEditar.id_insumo,
        }
      );

      Toast.show({
        type: "success",
        text1: "Actualizado",
        text2: "La dosis se corrigió correctamente ✅",
      });

      setModalEditarVisible(false);
      cargarInsumosUsados();
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo actualizar la cantidad.",
      });
    }
  };

  const calcularFactor = (unidadBase, unidadUso) => {
    if (unidadBase === unidadUso) return 1;
    if (unidadBase === "Litros" && unidadUso === "Mililitros") return 0.001;
    if (unidadBase === "Mililitros" && unidadUso === "Litros") return 1000;
    if (unidadBase === "Kilogramos" && unidadUso === "Gramos") return 0.001;
    if (unidadBase === "Gramos" && unidadUso === "Kilogramos") return 1000;
    return 1;
  };

  const obtenerOpcionesPosibles = (unidadBase) => {
    switch (unidadBase) {
      case "Litros":
        return ["Litros", "Mililitros"];
      case "Mililitros":
        return ["Mililitros", "Litros"];
      case "Kilogramos":
        return ["Kilogramos", "Gramos"];
      case "Gramos":
        return ["Gramos", "Kilogramos"];
      default:
        return [unidadBase];
    }
  };

  const seleccionarInsumo = (item) => {
    setInsumoTemporal(item);
    setUnidadSeleccionada(item.nombre_unidad);
  };

  const agregarInsumo = () => {
    if (!cantidadInput || !insumoTemporal) return;

    const cantidadIngresada = parseFloat(cantidadInput);
    const factor = calcularFactor(
      insumoTemporal.nombre_unidad,
      unidadSeleccionada
    );
    const cantidadRealADescontar = cantidadIngresada * factor;

    // Validación de Stock CON TOAST ROJO 🔴
    if (cantidadRealADescontar > parseFloat(insumoTemporal.cantidad_stock)) {
      Toast.show({
        type: "error",
        text1: "Stock insuficiente",
        text2: `Solo tienes ${insumoTemporal.cantidad_stock} ${insumoTemporal.nombre_unidad} disponibles.`,
        visibilityTime: 4000,
      });
      return;
    }

    setInsumosSeleccionados([
      ...insumosSeleccionados,
      {
        ...insumoTemporal,
        cantidad: cantidadRealADescontar,
        cantidadDisplay: cantidadIngresada,
        unidadDisplay: unidadSeleccionada,
      },
    ]);

    limpiarModal();

    // Feedback visual rápido
    Toast.show({
      type: "success",
      text1: "Agregado",
      text2: `${insumoTemporal.nombre} listo para usar.`,
      visibilityTime: 1500,
    });
  };

  const limpiarModal = () => {
    setCantidadInput("");
    setInsumoTemporal(null);
    setUnidadSeleccionada("");
    setModalVisible(false);
  };

  const handleFinalizarTarea = async () => {
    // ESTA SE QUEDA COMO ALERT PORQUE NECESITA BOTONES DE CONFIRMACIÓN
    Alert.alert(
      "Confirmar Finalización",
      insumosSeleccionados.length > 0
        ? `Se descontarán ${insumosSeleccionados.length} productos de bodega. ¿Continuar?`
        : "¿Seguro que terminaste sin usar insumos?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "FINALIZAR", onPress: enviarDatos },
      ]
    );
  };

  const enviarDatos = async () => {
    try {
      await api.put(`/actividades/finalizar/${tarea.id_tarea}`, {
        insumosUsados: insumosSeleccionados.map((i) => ({
          id_insumo: i.id_insumo,
          cantidad: i.cantidad,
        })),
        jornada: jornadaSeleccionada,
        fecha_ejecucion: fechaEjecucion.toISOString(),
      });

      // TOAST VERDE DE ÉXITO ✅
      Toast.show({
        type: "success",
        text1: "¡Excelente trabajo!",
        text2: "Tarea finalizada e inventario actualizado 🚜",
        visibilityTime: 3000,
      });

      navigation.goBack(); // Regresa a la lista
    } catch (error) {
      console.error(error);
      // TOAST ROJO DE ERROR ❌
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo finalizar. Revisa tu conexión 📡",
      });
    }
  };

  const renderOpcionesUnidad = () => {
    if (!insumoTemporal) return null;
    const opciones = obtenerOpcionesPosibles(insumoTemporal.nombre_unidad);
    // Las funciones de edición `abrirEdicion` y `guardarEdicionInsumo`
    // se definen en el scope del componente para ser accesibles
    // desde el listado y desde el modal.

    return (
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={unidadSeleccionada}
          onValueChange={(val) => setUnidadSeleccionada(val)}
          dropdownIconColor="black"
          style={{
            color: "black",
            backgroundColor: "white",
            height: 50,
            width: 160,
          }}
          itemStyle={{ color: "black" }}
        >
          {opciones.map((op) => (
            <Picker.Item key={op} label={op} value={op} />
          ))}
        </Picker>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.tituloTipo}>{tarea.nombre_tipo_actividad}</Text>
        <View
          style={[
            styles.badge,
            tarea.estado === "HECHO" ? styles.bgVerde : styles.bgNaranja,
          ]}
        >
          <Text style={styles.badgeText}>{tarea.estado}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <MaterialIcons name="place" size={24} color="#555" />
          <Text style={styles.textoDetalle}>
            {tarea.nombre_lote}{" "}
            <Text style={{ fontWeight: "bold" }}>
              ({tarea.nombre_variedad || "Sin Cultivo"})
            </Text>
          </Text>
        </View>
        <Text style={styles.descripcion}>{tarea.descripcion}</Text>
      </View>
      {tarea.estado === "HECHO" && insumos.length > 0 && (
        <View style={{ marginTop: 20, paddingHorizontal: 10 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: "#1b5e20",
              marginBottom: 10,
            }}
          >
            🧪 Insumos Utilizados
          </Text>

          {insumos.map((insumo, index) => (
            <View
              key={index}
              style={{
                backgroundColor: "white",
                padding: 15,
                borderRadius: 10,
                marginBottom: 10,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                // Sombrita suave para que se vea moderno
                elevation: 2,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 1.41,
              }}
            >
              {/* Lado Izquierdo: Nombre y Categoría */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#333" }}
                >
                  {insumo.nombre_insumo}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#666",
                    marginTop: 4,
                    fontStyle: "italic",
                  }}
                >
                  {insumo.nombre_categoria}
                </Text>
              </View>

              {/* Lado Derecho: Cantidad */}
              <View
                style={{
                  backgroundColor: "#e8f5e9",
                  paddingVertical: 5,
                  paddingHorizontal: 10,
                  borderRadius: 5,
                }}
              >
                <Text style={{ color: "#1b5e20", fontWeight: "bold" }}>
                  {insumo.cantidad_usada} {insumo.unidad_medida}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => abrirEdicion(insumo)}
                style={{
                  padding: 5,
                  backgroundColor: "#fff3e0",
                  borderRadius: 50,
                }}
              >
                <MaterialIcons name="edit" size={20} color="#f57c00" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Mensaje si está HECHO pero no gastó nada */}
      {tarea.estado === "HECHO" && insumos.length === 0 && (
        <View style={{ marginTop: 20, alignItems: "center" }}>
          <Text style={{ color: "#888", fontStyle: "italic" }}>
            Esta tarea se finalizó sin reportar insumos.
          </Text>
        </View>
      )}

      {tarea.estado === "PENDIENTE" && (
        <View style={styles.insumosSection}>
          <Text style={styles.tituloSeccion}>📦 Insumos / Bodega</Text>

          {insumosSeleccionados.map((item, index) => (
            <View key={index} style={styles.insumoItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nombreItem}>{item.nombre}</Text>
                <Text style={styles.detalleItem}>
                  Usado:{" "}
                  <Text style={{ fontWeight: "bold" }}>
                    {item.cantidadDisplay} {item.unidadDisplay}
                  </Text>
                  {item.unidadDisplay !== item.nombre_unidad && (
                    <Text style={{ fontSize: 12, color: "#d32f2f" }}>
                      {" "}
                      (Stock: -{item.cantidad.toFixed(3)} {item.nombre_unidad})
                    </Text>
                  )}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  const nuevaLista = insumosSeleccionados.filter(
                    (_, i) => i !== index
                  );
                  setInsumosSeleccionados(nuevaLista);
                }}
              >
                <MaterialIcons name="close" size={20} color="red" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={styles.btnAgregar}
            onPress={() => setModalVisible(true)}
          >
            <MaterialIcons name="add-shopping-cart" size={24} color="white" />
            <Text style={{ color: "white", fontWeight: "bold", marginLeft: 8 }}>
              AGREGAR INSUMO
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* --- SELECCIÓN DE FECHA REAL --- */}
      {tarea.estado === "PENDIENTE" && (
        <View style={styles.card}>
          <Text style={styles.tituloSeccion}>
            📅 ¿Cuándo realizaste la labor?
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#e3f2fd",
              padding: 12,
              borderRadius: 8,
              marginTop: 10,
              borderWidth: 1,
              borderColor: "#2196f3",
            }}
          >
            <MaterialIcons
              name="event"
              size={24}
              color="#1976d2"
              style={{ marginRight: 10 }}
            />
            <Text
              style={{ fontSize: 18, color: "#1976d2", fontWeight: "bold" }}
            >
              {fechaEjecucion.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={fechaEjecucion}
              mode="date"
              display="default"
              onChange={onChangeDate}
              maximumDate={new Date()}
            />
          )}
        </View>
      )}

      {/* --- SELECCIÓN DE JORNADA --- */}
      {tarea.estado === "PENDIENTE" && (
        <View style={styles.card}>
          <Text style={styles.tituloSeccion}>
            🕒 ¿En qué jornada trabajaste?
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 10,
            }}
          >
            {/* Opción MAÑANA */}
            <TouchableOpacity
              onPress={() => setJornadaSeleccionada("MANANA")}
              style={estiloJornada(
                jornadaSeleccionada === "MANANA",
                "#fff9c4",
                "#fbc02d"
              )}
            >
              <Text style={{ fontSize: 20 }}>🌅</Text>
              <Text style={{ fontWeight: "bold", color: "#555", fontSize: 12 }}>
                Mañana
              </Text>
            </TouchableOpacity>

            {/* Opción TARDE */}
            <TouchableOpacity
              onPress={() => setJornadaSeleccionada("TARDE")}
              style={estiloJornada(
                jornadaSeleccionada === "TARDE",
                "#d7ccc8",
                "#5d4037"
              )}
            >
              <Text style={{ fontSize: 20 }}>🌇</Text>
              <Text style={{ fontWeight: "bold", color: "#555", fontSize: 12 }}>
                Tarde
              </Text>
            </TouchableOpacity>

            {/* Opción COMPLETA */}
            <TouchableOpacity
              onPress={() => setJornadaSeleccionada("COMPLETA")}
              style={estiloJornada(
                jornadaSeleccionada === "COMPLETA",
                "#c8e6c9",
                "#2e7d32"
              )}
            >
              <Text style={{ fontSize: 20 }}>☀️</Text>
              <Text style={{ fontWeight: "bold", color: "#555", fontSize: 12 }}>
                Todo el día
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {tarea.estado === "PENDIENTE" && (
        <TouchableOpacity
          style={styles.btnFinalizar}
          onPress={handleFinalizarTarea}
        >
          <MaterialIcons name="check-circle" size={28} color="white" />
          <Text style={styles.textoBtnFinalizar}>FINALIZAR TAREA</Text>
        </TouchableOpacity>
      )}

      {/* MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar de Bodega</Text>
            {!insumoTemporal ? (
              <FlatList
                data={listaInsumos}
                keyExtractor={(i) => i.id_insumo.toString()}
                style={{ maxHeight: 250 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.itemLista}
                    onPress={() => seleccionarInsumo(item)}
                  >
                    <Text style={styles.itemTexto}>{item.nombre}</Text>
                    <Text style={styles.itemSubtexto}>
                      Disp: {item.cantidad_stock} {item.nombre_unidad}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View>
                <Text style={{ fontSize: 16, marginBottom: 5 }}>
                  Producto:{" "}
                  <Text style={{ fontWeight: "bold" }}>
                    {insumoTemporal.nombre}
                  </Text>
                </Text>
                <Text style={{ fontSize: 12, color: "#666", marginBottom: 15 }}>
                  En Bodega: {insumoTemporal.cantidad_stock}{" "}
                  {insumoTemporal.nombre_unidad}
                </Text>

                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.inputCantidad}
                    placeholder="Cant."
                    keyboardType="numeric"
                    value={cantidadInput}
                    onChangeText={setCantidadInput}
                    autoFocus
                  />
                  {renderOpcionesUnidad()}
                </View>

                <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
                  <TouchableOpacity
                    style={[styles.btnModal, { backgroundColor: "#757575" }]}
                    onPress={() => setInsumoTemporal(null)}
                  >
                    <Text style={{ color: "white" }}>Atrás</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btnModal, { backgroundColor: "#2e7d32" }]}
                    onPress={agregarInsumo}
                  >
                    <Text style={{ color: "white", fontWeight: "bold" }}>
                      Confirmar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            <TouchableOpacity
              style={styles.btnCerrarModal}
              onPress={limpiarModal}
            >
              <Text style={{ color: "#d32f2f", fontWeight: "bold" }}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* --- MODAL PARA EDITAR CANTIDAD --- */}
      <Modal
        visible={modalEditarVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalEditarVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: "80%" }]}>
            <Text style={styles.modalTitle}>Corregir Cantidad</Text>

            {insumoAEditar && (
              <Text style={{ textAlign: "center", marginBottom: 10 }}>
                Insumo:{" "}
                <Text style={{ fontWeight: "bold" }}>
                  {insumoAEditar.nombre_insumo}
                </Text>
              </Text>
            )}

            <TextInput
              style={[
                styles.inputCantidad,
                {
                  flex: 0, // IMPORTANTE: Anula el flex: 1 del estilo original
                  width: "100%", // Ocupa todo el ancho disponible
                  color: "#000000", // Fuerza letras negras
                  backgroundColor: "#ffffff", // Fuerza fondo blanco
                },
              ]}
              value={nuevaCantidad}
              onChangeText={(text) => setNuevaCantidad(text)}
              keyboardType="numeric"
              placeholder="Nueva cantidad real"
              placeholderTextColor="#999"
              autoFocus={true}
            />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                marginLeft: 10,
                color: "#333",
              }}
            >
              {insumoAEditar?.unidad_medida}
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
              <TouchableOpacity
                style={[styles.btnModal, { backgroundColor: "#d32f2f" }]}
                onPress={() => setModalEditarVisible(false)}
              >
                <Text style={{ color: "white" }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnModal, { backgroundColor: "#1976d2" }]}
                onPress={guardarEdicionInsumo}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  Guardar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// Función auxiliar para estilos de botones de jornada
const estiloJornada = (seleccionado, bgColor, borderColor) => ({
  backgroundColor: seleccionado ? bgColor : "#f5f5f5",
  borderColor: seleccionado ? borderColor : "#e0e0e0",
  borderWidth: 2,
  borderRadius: 10,
  padding: 10,
  flex: 1,
  marginHorizontal: 5,
  alignItems: "center",
});

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#f5f5f5", flexGrow: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  tituloTipo: { fontSize: 22, fontWeight: "bold", color: "#1b5e20", flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  bgVerde: { backgroundColor: "#2e7d32" },
  bgNaranja: { backgroundColor: "#ff9800" },
  badgeText: { color: "white", fontWeight: "bold", fontSize: 12 },
  card: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  textoDetalle: { fontSize: 16, color: "#333" },
  descripcion: {
    fontSize: 16,
    color: "#333",
    marginTop: 5,
    fontStyle: "italic",
  },
  insumosSection: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  tituloSeccion: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1b5e20",
    marginBottom: 5,
  },
  btnAgregar: {
    backgroundColor: "#1976d2",
    flexDirection: "row",
    padding: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  insumoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  nombreItem: { fontSize: 16, fontWeight: "bold", color: "#333" },
  detalleItem: { fontSize: 14, color: "#1b5e20" },
  btnFinalizar: {
    backgroundColor: "#2e7d32",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    marginBottom: 30,
  },
  textoBtnFinalizar: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 10,
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
    padding: 25,
    borderRadius: 15,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  itemLista: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemTexto: { fontSize: 16, fontWeight: "bold", color: "#333" },
  itemSubtexto: { fontSize: 14, color: "#666" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  inputCantidad: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 18,
    textAlign: "center",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    justifyContent: "center",
    backgroundColor: "#fafafa",
  },
  btnModal: { flex: 1, padding: 12, borderRadius: 8, alignItems: "center" },
  btnCerrarModal: { marginTop: 20, alignItems: "center" },
});

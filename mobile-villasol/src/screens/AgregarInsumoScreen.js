import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView, // <--- 1. IMPORTANTE
  Platform, // <--- 2. IMPORTANTE
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";
import Toast from "react-native-toast-message";

export default function AgregarInsumoScreen({ navigation }) {
  const [insumos, setInsumos] = useState([]);

  // Estados para las listas dinámicas
  const [listaUnidades, setListaUnidades] = useState([]);
  const [listaCategorias, setListaCategorias] = useState([]);
  const [cargandoListas, setCargandoListas] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Estados formulario
  const [idInsumo, setIdInsumo] = useState(null);
  const [nombre, setNombre] = useState("");
  const [cantidadStock, setCantidadStock] = useState("");
  const [costoPromedio, setCostoPromedio] = useState("");
  const [stockMinimo, setStockMinimo] = useState("");

  const [idUnidadSeleccionada, setIdUnidadSeleccionada] = useState(null);
  const [idCategoriaSeleccionada, setIdCategoriaSeleccionada] = useState(null);

  useEffect(() => {
    cargarInsumos();
    cargarListasDesplegables();
  }, []);

  const cargarInsumos = async () => {
    try {
      const response = await api.get("/insumos");
      setInsumos(response.data);
    } catch (error) {
      console.error("Error cargando insumos", error);
    }
  };

  const cargarListasDesplegables = async () => {
    try {
      setCargandoListas(true);
      const response = await api.get("/insumos/datos-formulario");
      setListaCategorias(response.data.categorias);
      setListaUnidades(response.data.unidades);
    } catch (error) {
      console.error("Error cargando listas", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se cargaron las listas.",
      });
    } finally {
      setCargandoListas(false);
    }
  };

  const abrirCrear = () => {
    setModoEdicion(false);
    limpiarFormulario();
    setModalVisible(true);
  };

  const abrirEditar = (item) => {
    setModoEdicion(true);
    setIdInsumo(item.id_insumo);
    setNombre(item.nombre);
    setCantidadStock(item.cantidad_stock?.toString() || "0");
    setCostoPromedio(item.costo_unitario_promedio?.toString() || "0");
    setStockMinimo(item.stock_minimo?.toString() || "0.5");
    setIdUnidadSeleccionada(item.id_unidad);
    setIdCategoriaSeleccionada(item.id_categoria_insumo);
    setModalVisible(true);
  };

  const limpiarFormulario = () => {
    setIdInsumo(null);
    setNombre("");
    setCantidadStock("");
    setCostoPromedio("");
    setStockMinimo("");
    setIdUnidadSeleccionada(null);
    setIdCategoriaSeleccionada(null);
  };

  const guardarInsumo = async () => {
    if (
      !nombre ||
      !cantidadStock ||
      !idUnidadSeleccionada ||
      !idCategoriaSeleccionada
    ) {
      Toast.show({
        type: "info",
        text1: "Faltan datos",
        text2: "Nombre, Cantidad, Unidad y Categoría son obligatorios ⚠️",
      });
      return;
    }

    const datos = {
      nombre: nombre,
      id_categoria_insumo: idCategoriaSeleccionada,
      id_unidad: idUnidadSeleccionada,
      cantidad_stock: parseFloat(cantidadStock),
      stock_minimo: parseFloat(stockMinimo || 0.5),
      costo_unitario_promedio: parseFloat(costoPromedio || 0),
    };

    try {
      if (modoEdicion) {
        await api.put(`/insumos/${idInsumo}`, datos);
        Toast.show({
          type: "success",
          text1: "¡Actualizado!",
          text2: "Insumo modificado 📦",
        });
      } else {
        await api.post("/insumos", datos);
        Toast.show({
          type: "success",
          text1: "¡Registrado!",
          text2: "Nuevo insumo agregado 🚜",
        });
      }
      setModalVisible(false);
      cargarInsumos();
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo guardar.",
      });
    }
  };

  const renderItem = ({ item }) => {
    const unidadObj = listaUnidades.find((u) => u.id_unidad === item.id_unidad);
    const catObj = listaCategorias.find(
      (c) => c.id_categoria === item.id_categoria_insumo
    );

    const nombreUnidad = unidadObj ? unidadObj.nombre_unidad : "Unidad";
    const nombreCategoria = catObj ? catObj.nombre_categoria : "General";

    const stockMin = item.stock_minimo || 0.5;
    const esBajo = parseFloat(item.cantidad_stock) <= parseFloat(stockMin);

    return (
      <TouchableOpacity style={styles.card} onPress={() => abrirEditar(item)}>
        <View style={styles.cardIcon}>
          <Ionicons
            name="flask-outline"
            size={24}
            color={esBajo ? "#D32F2F" : "#2E7D32"}
          />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.nombre}</Text>
          <Text style={styles.cardSub}>
            Stock: {item.cantidad_stock} {nombreUnidad}
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "bold",
              marginTop: 2,
              color: esBajo ? "#D32F2F" : "#2E7D32",
            }}
          >
            {esBajo ? "⚠️ BAJO STOCK" : "✅ NORMAL"}
          </Text>
          <Text style={styles.cardSubCat}>{nombreCategoria}</Text>
        </View>
        <Ionicons name="create-outline" size={24} color="#666" />
      </TouchableOpacity>
    );
  };

  const SelectorChips = ({ lista, seleccionado, onSelect, tipo }) => (
    <View style={styles.chipsContainer}>
      {lista.map((item) => {
        const id = tipo === "unidad" ? item.id_unidad : item.id_categoria;
        const nombre =
          tipo === "unidad" ? item.nombre_unidad : item.nombre_categoria;

        return (
          <TouchableOpacity
            key={id}
            style={[styles.chip, seleccionado === id && styles.chipSelected]}
            onPress={() => onSelect(id)}
          >
            <Text
              style={[
                styles.chipText,
                seleccionado === id && styles.chipTextSelected,
              ]}
            >
              {nombre}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.fab} onPress={abrirCrear}>
        <Ionicons name="add" size={40} color="white" />
      </TouchableOpacity>

      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={28} color="#1B5E20" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inventario Finca</Text>
      </View>

      <FlatList
        data={insumos}
        keyExtractor={(item) => item.id_insumo.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* --- AQUI COMIENZA EL MODAL CORREGIDO --- */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        {/* Usamos KeyboardAvoidingView para que el teclado empuje el contenido */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {cargandoListas ? (
                <ActivityIndicator size="large" color="#2E7D32" />
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalTitle}>
                    {modoEdicion ? "Editar Producto" : "Nuevo Insumo"}
                  </Text>

                  <Text style={styles.label}>Nombre del Insumo *</Text>
                  <TextInput
                    style={styles.input}
                    value={nombre}
                    onChangeText={setNombre}
                    placeholder="Ej: Daconil"
                  />

                  <Text style={styles.label}>Categoría *</Text>
                  <SelectorChips
                    lista={listaCategorias}
                    seleccionado={idCategoriaSeleccionada}
                    onSelect={setIdCategoriaSeleccionada}
                    tipo="categoria"
                  />

                  <Text style={styles.label}>Cantidad y Unidad *</Text>
                  <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <TextInput
                        style={styles.input}
                        value={cantidadStock}
                        onChangeText={setCantidadStock}
                        keyboardType="numeric"
                        placeholder="Cant."
                      />
                    </View>
                  </View>
                  <SelectorChips
                    lista={listaUnidades}
                    seleccionado={idUnidadSeleccionada}
                    onSelect={setIdUnidadSeleccionada}
                    tipo="unidad"
                  />

                  {/* ESTOS SON LOS CAMPOS QUE SE OCULTABAN */}
                  <Text style={styles.label}>Costo Promedio ($)</Text>
                  <TextInput
                    style={styles.input}
                    value={costoPromedio}
                    onChangeText={setCostoPromedio}
                    keyboardType="numeric"
                    placeholder="0"
                  />

                  <Text style={styles.label}>Stock Mínimo (Alerta)</Text>
                  <TextInput
                    style={styles.input}
                    value={stockMinimo}
                    onChangeText={setStockMinimo}
                    keyboardType="numeric"
                    placeholder="0.5"
                  />

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.btn, styles.btnCancel]}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.btnText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btn, styles.btnSave]}
                      onPress={guardarInsumo}
                    >
                      <Text style={styles.btnText}>Guardar</Text>
                    </TouchableOpacity>
                  </View>
                  {/* Agregamos un pequeño espacio extra al final para scroll seguro */}
                  <View style={{ height: 20 }} />
                </ScrollView>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F2", padding: 20 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  backButton: { padding: 5, marginRight: 10 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#1B5E20", flex: 1 },
  card: {
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  cardIcon: {
    marginRight: 15,
    backgroundColor: "#E8F5E9",
    padding: 10,
    borderRadius: 50,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  cardSub: { color: "#555", fontSize: 14 },
  cardSubCat: {
    color: "#2E7D32",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 2,
  },
  fab: {
    position: "absolute",
    bottom: 40,
    right: 20,
    backgroundColor: "#2E7D32",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    zIndex: 10,
  },

  // ESTILOS DEL MODAL
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    elevation: 10,
    maxHeight: "90%", // Esto permite que si el teclado sube, el contenido se encoja
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 15,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
  },
  row: { flexDirection: "row", alignItems: "center" },
  modalButtons: {
    flexDirection: "row",
    marginTop: 25,
    justifyContent: "space-between",
  },
  btn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  btnCancel: { backgroundColor: "#d32f2f" },
  btnSave: { backgroundColor: "#2E7D32" },
  btnText: { color: "white", fontWeight: "bold", fontSize: 16 },
  chipsContainer: { flexDirection: "row", flexWrap: "wrap", marginBottom: 5 },
  chip: {
    backgroundColor: "#E0E0E0",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: { backgroundColor: "#2E7D32" },
  chipText: { color: "#333", fontSize: 12 },
  chipTextSelected: { color: "white", fontWeight: "bold" },
});

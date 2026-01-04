import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import api from "../services/api";
import Toast from "react-native-toast-message"; // <--- 1. IMPORTAR TOAST

export default function ReportarScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  // Listas
  const [lotes, setLotes] = useState([]);
  const [tipos, setTipos] = useState([]);

  // Formulario
  const [form, setForm] = useState({
    id_tipo_actividad: "",
    id_lote: "",
    descripcion: "",
  });

  useEffect(() => {
    cargarListas();
  }, []);

  const cargarListas = async () => {
    try {
      const res = await api.get("/actividades/datos-formulario");
      setLotes(res.data.lotes);
      setTipos(res.data.tipos);
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Error de carga",
        text2: "No se pudieron cargar las listas de lotes o actividades.",
      });
    }
  };

  const handleGuardarLabor = async () => {
    // 1. VALIDACIÓN (Alerta Azul)
    if (!form.id_tipo_actividad || !form.id_lote || !form.descripcion) {
      Toast.show({
        type: "info",
        text1: "Faltan datos",
        text2: "Por favor completa todos los campos ⚠️",
      });
      return;
    }

    setLoading(true);
    try {
      const userJson = await AsyncStorage.getItem("usuario");
      const user = JSON.parse(userJson);
      const userId = user.id || user.id_usuario;

      const nuevaTarea = {
        id_tipo_actividad: form.id_tipo_actividad,
        id_lote: form.id_lote,
        descripcion: `[ESPONTANEA] ${form.descripcion}`,
        fecha_programada: new Date().toISOString().split("T")[0], // Fecha HOY
        id_usuario: userId,
        estado: "PENDIENTE",
        costo_mano_obra: 0,
        origen: "ESPONTANEA",
      };

      await api.post("/actividades", nuevaTarea);

      // 2. ÉXITO (Alerta Verde)
      Toast.show({
        type: "success",
        text1: "¡Registrado!",
        text2: "Labor espontánea guardada exitosamente ✅",
        visibilityTime: 3000,
      });

      navigation.goBack();
    } catch (error) {
      console.error(error);
      // 3. ERROR (Alerta Roja)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo guardar la labor. Intenta nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="add-task" size={50} color="#e65100" />
        <Text style={styles.title}>Labor Espontánea</Text>
        <Text style={styles.subtitle}>Registrar actividad NO planificada</Text>
      </View>

      <View style={styles.card}>
        {/* 1. TIPO DE ACTIVIDAD */}
        <Text style={styles.label}>¿Qué labor realizaste?</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={form.id_tipo_actividad}
            dropdownIconColor="black"
            style={{ color: "black", backgroundColor: "white" }}
            itemStyle={{ color: "black" }}
            onValueChange={(val) =>
              setForm({ ...form, id_tipo_actividad: val })
            }
          >
            <Picker.Item label="Seleccione actividad..." value="" />
            {tipos.map((t) => (
              <Picker.Item
                key={t.id_tipo_actividad}
                label={t.nombre_tipo_actividad}
                value={t.id_tipo_actividad}
              />
            ))}
          </Picker>
        </View>

        {/* 2. LOTE (CON CULTIVO) */}
        <Text style={styles.label}>¿En qué lote?</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={form.id_lote}
            dropdownIconColor="black"
            style={{ color: "black", backgroundColor: "white" }}
            itemStyle={{ color: "black" }}
            onValueChange={(val) => setForm({ ...form, id_lote: val })}
          >
            <Picker.Item label="Seleccione el lote..." value="" />
            {lotes.map((l) => (
              <Picker.Item
                key={l.id_lote}
                label={`${l.nombre_lote} - ${
                  l.nombre_variedad || "Sin Cultivo"
                }`}
                value={l.id_lote}
              />
            ))}
          </Picker>
        </View>

        {/* 3. DESCRIPCIÓN */}
        <Text style={styles.label}>Observaciones / Detalle:</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Ej: Se realizó limpieza extra en el sector norte..."
          multiline={true}
          numberOfLines={4}
          value={form.descripcion}
          onChangeText={(text) => setForm({ ...form, descripcion: text })}
        />

        {/* BOTÓN ENVIAR */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleGuardarLabor}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>REGISTRAR LABOR</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff3e0", flexGrow: 1 },
  header: { alignItems: "center", marginBottom: 20, marginTop: 10 },
  title: { fontSize: 26, fontWeight: "bold", color: "#e65100", marginTop: 10 },
  subtitle: { color: "#666", fontSize: 16 },
  card: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
    marginTop: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ffcc80",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ffcc80",
    borderRadius: 8,
    padding: 10,
    height: 100,
    textAlignVertical: "top",
    backgroundColor: "#fff",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#e65100",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 25,
    elevation: 2,
  },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 18 },
});

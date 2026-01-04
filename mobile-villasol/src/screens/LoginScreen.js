import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import api from "../services/api";
import Toast from "react-native-toast-message"; // <--- IMPORTANTE

export default function LoginScreen({ navigation }) {
  const [documento, setDocumento] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  const IMAGEN_FONDO = {
    uri: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1932&auto=format&fit=crop",
  };
  const LOGO_FINCA = require("../../assets/images/logo.png");

  const handleLogin = async () => {
    // 1. Validación Local
    if (!documento || !password) {
      Toast.show({
        type: "info", // Azulito
        text1: "Faltan datos",
        text2: "Ingresa documento y contraseña para entrar. 🔒",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/login", { documento, password });
      const usuarioData = response.data.usuario;
      const token = response.data.token;

      // 2. Guardar Sesión
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("usuario", JSON.stringify(usuarioData));

      // 3. ¡BIENVENIDA CON TOAST! 👋
      Toast.show({
        type: "success", // Verde
        text1: `¡Hola, ${usuarioData.nombre}!`,
        text2: "Bienvenido a SISVILLASOL 🚜",
        visibilityTime: 3000,
      });

      // Pequeña pausa para que vean el mensaje antes de cambiar de pantalla
      setTimeout(() => {
        const userRole = usuarioData?.rol || usuarioData?.nombre_rol; // Simplificado

        if ((userRole || "").toString().toUpperCase() === "ADMIN") {
          navigation.replace("AdminHome");
        } else {
          navigation.replace("Home");
        }
      }, 1000);
    } catch (error) {
      console.error("Error Login:", error);

      // 4. ERROR CON TOAST ❌
      if (error.response && error.response.status === 404) {
        Toast.show({
          type: "error", // Rojo
          text1: "Acceso Denegado",
          text2: "Documento o contraseña incorrectos 🚫",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error de Conexión",
          text2: "No se pudo conectar con el servidor 📡",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={IMAGEN_FONDO}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardContainer}
        >
          <View style={styles.logoContainer}>
            <Image source={LOGO_FINCA} style={styles.logo} />
            <Text style={styles.titulo}>SISVILLASOL</Text>
            <Text style={styles.subtitulo}>Gestión Agrícola Inteligente</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="person"
                size={24}
                color="#1b5e20"
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                placeholder="Documento de Identidad"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={documento}
                onChangeText={setDocumento}
              />
            </View>

            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="lock"
                size={24}
                color="#1b5e20"
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#666"
                secureTextEntry={secureText}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                <MaterialIcons
                  name={secureText ? "visibility-off" : "visibility"}
                  size={24}
                  color="#999"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.botonLogin}
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.textoBoton}>INGRESAR</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.footerText}>
              Finca Villasol Vereda de Bartaqui Chitagá © 2026
            </Text>
          </View>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

// ... TUS ESTILOS SIGUEN IGUAL ABAJO (NO LOS BORRES) ...
const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(22, 20, 20, 0.84)",
    justifyContent: "center",
    padding: 20,
  },
  keyboardContainer: { flex: 1, justifyContent: "center" },
  logoContainer: { alignItems: "center", marginBottom: 50 },
  logo: {
    width: 330,
    height: 160,
    marginBottom: 15,
    resizeMode: "contain",
    tintColor: "white",
  },
  titulo: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    letterSpacing: 2,
  },
  subtitulo: { fontSize: 16, color: "#e0e0e0", marginTop: 5 },
  formContainer: { width: "100%" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 5,
    marginBottom: 20,
    elevation: 5,
    height: 60,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: "#333", height: "100%" },
  botonLogin: {
    backgroundColor: "#2e7d32",
    borderRadius: 30,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    elevation: 5,
  },
  textoBoton: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  footerText: {
    textAlign: "center",
    color: "white",
    marginTop: 30,
    opacity: 0.8,
    fontSize: 12,
  },
});

import React, { useState, useEffect } from "react";
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
import Toast from "react-native-toast-message";

export default function LoginScreen({ navigation }) {
  const [documento, setDocumento] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  // 1. NUEVO ESTADO PARA EL CHECKBOX
  const [rememberMe, setRememberMe] = useState(false);

  const IMAGEN_FONDO = {
    uri: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1932&auto=format&fit=crop",
  };
  const LOGO_FINCA = require("../../assets/images/logo.png");

  // 2. EFECTO: AL ABRIR LA PANTALLA, BUSCAMOS SI HAY ALGO GUARDADO
  useEffect(() => {
    const cargarCredenciales = async () => {
      try {
        const docGuardado = await AsyncStorage.getItem("saved_documento");
        const passGuardado = await AsyncStorage.getItem("saved_password");

        if (docGuardado && passGuardado) {
          setDocumento(docGuardado);
          setPassword(passGuardado);
          setRememberMe(true);
        } else {
          console.log("🤷‍♂️ No había nada guardado o faltaba un dato.");
        }
      } catch (error) {
        console.log("❌ Error cargando credenciales", error);
      }
    };
    cargarCredenciales();
  }, []);

  const handleLogin = async () => {
    const documentoLimpio = documento.trim();
    const passwordLimpio = password.trim();

    if (!documentoLimpio || !passwordLimpio) {
      Toast.show({
        type: "info",
        text1: "Faltan datos",
        text2: "Ingresa documento y contraseña para entrar. 🔒",
      });
      return;
    }
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        documento: documentoLimpio,
        password: passwordLimpio,
      });
      const usuarioData = response.data.usuario;
      const token = response.data.token;
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("usuario", JSON.stringify(usuarioData));

      // CHIVATO 5: Momento de la verdad
      if (rememberMe) {
        await AsyncStorage.setItem("saved_documento", documentoLimpio);
        await AsyncStorage.setItem("saved_password", passwordLimpio);
      } else {
        console.log(
          "❌ El usuario NO marcó el check. Borrando credenciales viejas."
        );
        await AsyncStorage.removeItem("saved_documento");
        await AsyncStorage.removeItem("saved_password");
      }

      Toast.show({
        type: "success", // Verde
        text1: `¡Hola, ${usuarioData.nombre} ${usuarioData.apellido}!`,
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
    <ImageBackground source={IMAGEN_FONDO} style={styles.background}>
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
            {/* Input Documento */}
            <View style={styles.inputWrapper}>
              <MaterialIcons name="person" size={24} color="#2e7d32" />
              <TextInput
                style={styles.input}
                placeholder="Número de Documento"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                value={documento}
                onChangeText={setDocumento}
              />
            </View>

            {/* Input Password */}
            <View style={styles.inputWrapper}>
              <MaterialIcons name="lock" size={24} color="#2e7d32" />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#aaa"
                secureTextEntry={secureText}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                <MaterialIcons
                  name={secureText ? "visibility-off" : "visibility"}
                  size={24}
                  color="#aaa"
                />
              </TouchableOpacity>
            </View>

            {/* 4. CHECKBOX "RECORDARME" (Nuevo Componente Visual) */}
            <TouchableOpacity
              style={styles.rememberContainer}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <MaterialIcons
                name={rememberMe ? "check-box" : "check-box-outline-blank"}
                size={24}
                color="white"
              />
              <Text style={styles.rememberText}>Recordar mis datos</Text>
            </TouchableOpacity>

            {/* Botón Ingresar */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>INGRESAR</Text>
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

const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(22, 20, 20, 0.84)", // Un poco más claro para ver fondo
    justifyContent: "center",
    padding: 20,
  },
  keyboardContainer: { flex: 1, justifyContent: "center" },
  logoContainer: { alignItems: "center", marginBottom: 40 },
  logo: {
    width: 330, // Ajusté un poco el tamaño para que no ocupe tanto
    height: 170,
    marginBottom: 30,
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
    marginBottom: 15, // Un poco menos de margen
    elevation: 5,
    height: 55,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  // ESTILOS NUEVOS PARA EL CHECKBOX
  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginLeft: 10,
  },
  rememberText: {
    color: "white",
    marginLeft: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2e7d32",
    borderRadius: 30,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
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
    fontSize: 14,
  },
});

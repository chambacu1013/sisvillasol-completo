import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";
// Importación de tus pantallas
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import MisTareasScreen from "./src/screens/MisTareasScreen";
import ReportarScreen from "./src/screens/ReportarScreen";
import LotesScreen from "./src/screens/LotesScreen";
import DetalleTareaScreen from "./src/screens/DetalleTareaScreen";

const Stack = createNativeStackNavigator();
const toastConfig = {
  /* --- ALERTA DE ÉXITO (VERDE) --- */
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: "#2e7d32", // Verde Fuerte
        height: 130, // MUCHO MÁS ALTA
        width: "90%", // OCUPA CASI TODO EL ANCHO
        borderLeftWidth: 10, // Borde verde más grueso
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 22, // TÍTULO GIGANTE
        fontWeight: "bold",
      }}
      text2Style={{
        fontSize: 13, // SUBTÍTULO GRANDE
        color: "#333",
      }}
    />
  ),

  /* --- ALERTA DE ERROR (ROJA) --- */
  error: (props) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: "#d32f2f", // Rojo Fuerte
        height: 130,
        width: "90%",
        borderLeftWidth: 10,
      }}
      text1Style={{
        fontSize: 22,
        fontWeight: "bold",
      }}
      text2Style={{
        fontSize: 13,
        color: "#333",
      }}
    />
  ),

  /* --- ALERTA DE INFO (AZUL) --- */
  info: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: "#0288d1", // Azul
        height: 130,
        width: "90%",
        borderLeftWidth: 10,
      }}
      text1Style={{
        fontSize: 22,
        fontWeight: "bold",
      }}
      text2Style={{
        fontSize: 12,
        color: "#333",
      }}
    />
  ),
};
export default function App() {
  return (
    <>
      {/* 2. ABRIMOS LA ETIQUETA VACÍA (FRAGMENT) ARRIBA */}

      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="MisTareas"
            component={MisTareasScreen}
            options={{ headerShown: true, title: "Volver" }}
          />
          <Stack.Screen
            name="Reportar"
            component={ReportarScreen}
            options={{
              headerShown: true,
              title: "Volver",
              headerTintColor: "#d32f2f",
            }}
          />
          <Stack.Screen
            name="Lotes"
            component={LotesScreen}
            options={{
              headerShown: true,
              title: "Cultivos",
              headerTintColor: "#2e7d32",
            }}
          />
          <Stack.Screen
            name="DetalleTarea"
            component={DetalleTareaScreen}
            options={{ headerShown: true, title: "Detalle de Tarea" }}
          />
        </Stack.Navigator>
      </NavigationContainer>

      {/* 3. PONEMOS EL TOAST AQUÍ, AFUERA DEL NAVIGATION */}
      {/* 3. APLICAMOS LA CONFIGURACIÓN AQUÍ */}
      <Toast config={toastConfig} />

      {/* 4. CERRAMOS LA ETIQUETA VACÍA */}
    </>
  );
}

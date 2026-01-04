import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Si quieres usar iconos, Expo ya los trae instalados
import { MaterialIcons } from "@expo/vector-icons";

export default function HomeScreen({ navigation }) {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    cargarUsuario();
  }, []);

  const cargarUsuario = async () => {
    try {
      const userStored = await AsyncStorage.getItem("usuario");
      if (userStored) {
        setUsuario(JSON.parse(userStored));
      }
    } catch (error) {
      console.error("Error cargando usuario", error);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear(); // Borramos datos de sesión
    navigation.replace("Login"); // Volvemos al login
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola,</Text>
        <Text style={styles.name}>{usuario?.nombre || "Agricultor"} 👨‍🌾</Text>
      </View>

      <View style={styles.menu}>
        {/* Botón 1: Mis Tareas */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("MisTareas")}
        >
          {/* Antes tenías un Alert.alert, cámbialo por navigation.navigate('MisTareas') */}
          <MaterialIcons name="assignment" size={40} color="#1b5e20" />
          <Text style={styles.cardText}>Mis Tareas</Text>
        </TouchableOpacity>

        {/* Busca el botón rojo de "Reportar Problema" */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("Reportar")}
        >
          {/* Icono de Tarea Extra */}
          <MaterialIcons name="add-task" size={40} color="#e65100" />
          <Text style={styles.cardText}>Labor Espontánea</Text>
        </TouchableOpacity>
        {/* Botón 3: Mis Cultivos */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("Lotes")}
        >
          <MaterialIcons name="grass" size={40} color="#2e7d32" />
          <Text style={styles.cardText}>Lotes / Cultivos</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>CERRAR SESIÓN</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
    paddingTop: 50,
  },
  header: {
    marginBottom: 30,
  },
  greeting: {
    fontSize: 20,
    color: "#555",
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1b5e20",
  },
  menu: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "white",
    width: "48%", // Dos columnas
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 15,
    elevation: 3, // Sombra
  },
  cardText: {
    marginTop: 10,
    fontWeight: "bold",
    color: "#333",
  },
  logoutButton: {
    marginTop: "auto", // Lo empuja al final
    marginBottom: "27",
    backgroundColor: "#7dd37aff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutText: {
    color: "#455a64",
    fontWeight: "bold",
  },
});

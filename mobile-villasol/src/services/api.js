import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ⚠️ ¡IMPORTANTE! Reemplaza '192.168.X.X' con TU IP REAL del computador.
// No uses 'localhost' porque no funcionará en el celular.
const API_URL = "https://backend-villasol.onrender.com/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // Esperar máx 10 segundos
});

// Interceptor para añadir el token de autenticación (Bearer) a cada petición
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        // Backend espera header 'Authorization: Bearer <token>'
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // Si falla leer token, dejamos la petición seguir sin token
      console.warn("No se pudo leer token para la petición:", e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

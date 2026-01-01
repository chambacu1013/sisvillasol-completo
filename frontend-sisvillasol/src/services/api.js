import axios from "axios";

const api = axios.create({
  baseURL: "https://backend-villasol.onrender.com/api",
});

// 1. INTERCEPTOR DE SALIDA (REQUEST)
// "Antes de pedir algo, pégate el token en la frente"
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. INTERCEPTOR DE LLEGADA (RESPONSE) <--- ¡ESTO ES LO NUEVO!
// "Si el servidor responde con un error, revisa qué pasó"
api.interceptors.response.use(
  (response) => response, // Si todo salió bien, deja pasar la respuesta
  (error) => {
    // Si el error es 401 (No autorizado) o 403 (Prohibido/Vencido)
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      // A. Borramos el token viejo (ya no sirve)
      localStorage.removeItem("token");
      localStorage.removeItem("usuarioNombre");
      localStorage.removeItem("usuarioApellido");
      localStorage.removeItem("usuarioRol");

      // B. Mandamos al usuario al Login a la fuerza
      // (Usamos window.location para recargar la página completamente y limpiar memoria)
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;

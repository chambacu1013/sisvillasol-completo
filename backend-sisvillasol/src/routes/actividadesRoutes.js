const { Router } = require("express");
const router = Router();

// IMPORTAR CONTROLADOR
const {
  obtenerActividades,
  crearActividad,
  actualizarTarea,
  eliminarActividad,
  obtenerDatosFormulario, // <--- ESTO YA ESTABA IMPORTADO, PERO NO SE USABA ABAJO
  obtenerLotesDetallados,
  finalizarTarea,
  getHistorial,
} = require("../controllers/actividadesController");

const verificarToken = require("../middleware/authMiddleware");

// --- RUTAS ESPECÍFICAS (Deben ir ANTES de /:id) ---

// 1. Historial e Información Extra
router.get("/historial", verificarToken, getHistorial);
router.get("/info-lotes", verificarToken, obtenerLotesDetallados);

// 2. ¡ESTA ES LA QUE FALTABA! (Sin esto, da error 404 al cargar el formulario)
router.get("/datos-formulario", verificarToken, obtenerDatosFormulario);

// 3. Rutas GENERALES (Raíz)
router.get("/", verificarToken, obtenerActividades);
router.post("/", verificarToken, crearActividad);

// 4. Rutas con PARÁMETROS /:id (Siempre deben ir AL FINAL)
// Si pones 'datos-formulario' debajo de estas, el sistema creerá que "datos-formulario" es un ID.
router.put("/finalizar/:id", verificarToken, finalizarTarea);
router.put("/:id", verificarToken, actualizarTarea);
router.delete("/:id", verificarToken, eliminarActividad);

module.exports = router;

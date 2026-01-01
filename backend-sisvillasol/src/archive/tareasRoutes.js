const { Router } = require("express");
const router = Router();
const {
  crearTarea,
  finalizarTarea,
  obtenerMisTareas,
} = require("../controllers/tareasController");
const verificarToken = require("../middleware/authMiddleware");
// Rutas protegidas
router.post("/", verificarToken, crearTarea); // Asignar (Don Jaime)
router.get("/", verificarToken, obtenerMisTareas); // Consultar (Franklin/Jaime)
router.post("/finalizar", verificarToken, finalizarTarea); // <--- Nueva Ruta
module.exports = router;

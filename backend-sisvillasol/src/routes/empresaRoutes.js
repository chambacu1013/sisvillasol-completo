const { Router } = require("express");
const router = Router();
const {
  obtenerIdentidad,
  actualizarIdentidad,
} = require("../controllers/empresaController");
const verificarToken = require("../middleware/authMiddleware");

// Rutas protegidas (Solo Don Jaime debería poder editar esto)
router.get("/", verificarToken, obtenerIdentidad);
router.put("/", verificarToken, actualizarIdentidad); // Usamos PUT para actualizar

module.exports = router;

const { Router } = require("express");
const router = Router();
const {
  obtenerLotes,
  obtenerCatalogoEstados,
  actualizarEstadoLote,
} = require("../controllers/lotesController");
const verificarToken = require("../middleware/authMiddleware"); // <--- EL VIGILANTE

// Todas las rutas protegidas
router.get("/", verificarToken, obtenerLotes);
router.get("/catalogo-estados", verificarToken, obtenerCatalogoEstados);
router.put("/estado/:id_lote", verificarToken, actualizarEstadoLote);
module.exports = router;

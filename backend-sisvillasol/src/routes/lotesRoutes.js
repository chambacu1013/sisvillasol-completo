const { Router } = require("express");
const router = Router();
const { obtenerLotes, crearLote } = require("../controllers/lotesController");
const verificarToken = require("../middleware/authMiddleware"); // <--- EL VIGILANTE

// Todas las rutas protegidas
router.get("/", verificarToken, obtenerLotes);
router.post("/", verificarToken, crearLote);

module.exports = router;

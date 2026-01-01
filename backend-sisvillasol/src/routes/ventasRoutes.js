const { Router } = require("express");
const router = Router();
const {
  registrarVenta,
  obtenerVentas,
} = require("../controllers/ventasController");
const verificarToken = require("../middleware/authMiddleware");

// Rutas protegidas (Solo Don Jaime o Admin deberían poder vender)
router.post("/", verificarToken, registrarVenta);
router.get("/", verificarToken, obtenerVentas);

module.exports = router;

const { Router } = require("express");

const router = Router();

const verificarToken = require("../middleware/authMiddleware");

const {
  obtenerFacturas,
  obtenerAnios,
  obtenerFactura,
  crearFactura,
  actualizarFactura,
  eliminarFactura,
} = require("../controllers/insumosAgricultorController");

router.get("/", verificarToken, obtenerFacturas);

router.get("/anios", verificarToken, obtenerAnios);

router.get("/:id", verificarToken, obtenerFactura);

router.post("/", verificarToken, crearFactura);

router.put("/:id", verificarToken, actualizarFactura);

router.delete("/:id", verificarToken, eliminarFactura);

module.exports = router;

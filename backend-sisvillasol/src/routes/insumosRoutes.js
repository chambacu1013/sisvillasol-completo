const { Router } = require("express");
const router = Router();
const {
  obtenerInsumos,
  crearInsumo,
  actualizarInsumo,
  eliminarInsumo,
  obtenerDatosFormulario,
} = require("../controllers/insumosController");
const verificarToken = require("../middleware/authMiddleware");

router.get("/", verificarToken, obtenerInsumos);
router.get("/datos-formulario", verificarToken, obtenerDatosFormulario);
router.post("/", verificarToken, crearInsumo);
router.put("/:id", verificarToken, actualizarInsumo);
router.delete("/:id", verificarToken, eliminarInsumo);
module.exports = router;

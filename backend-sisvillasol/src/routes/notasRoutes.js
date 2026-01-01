const { Router } = require("express");
const router = Router();
const {
  obtenerNotas,
  crearNota,
  eliminarNota,
} = require("../controllers/notasController");
const verificarToken = require("../middleware/authMiddleware");

router.get("/", verificarToken, obtenerNotas);
router.post("/", verificarToken, crearNota);
router.delete("/:id", verificarToken, eliminarNota);

module.exports = router;

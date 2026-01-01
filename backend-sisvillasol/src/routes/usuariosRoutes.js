const { Router } = require("express");
const router = Router();
const {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
} = require("../controllers/usuariosController");
const verificarToken = require("../middleware/authMiddleware");

router.get("/", verificarToken, obtenerUsuarios);
router.post("/", verificarToken, crearUsuario);
router.put("/:id", verificarToken, actualizarUsuario);
router.delete("/:id", verificarToken, eliminarUsuario);

module.exports = router;

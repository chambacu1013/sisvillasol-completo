const { Router } = require("express");

const router = Router();

const verificarToken = require("../middleware/authMiddleware");

const {
  obtenerProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} = require("../controllers/productosAgricolasController");

router.get("/", verificarToken, obtenerProductos);

router.get("/:id", verificarToken, obtenerProducto);

router.post("/", verificarToken, crearProducto);

router.put("/:id", verificarToken, actualizarProducto);

router.delete("/:id", verificarToken, eliminarProducto);

module.exports = router;

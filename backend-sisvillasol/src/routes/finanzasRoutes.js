const { Router } = require("express");
const router = Router();
const {
  obtenerResumenFinanciero,
  obtenerVentas,
  crearVenta,
  eliminarVenta,
  obtenerGraficaAnual,
  actualizarVenta,
  obtenerDistribucionFinanciera,
} = require("../controllers/finanzasController");
const verificarToken = require("../middleware/authMiddleware");

router.get("/resumen", verificarToken, obtenerResumenFinanciero); // KPIs
router.get("/ventas", verificarToken, obtenerVentas); // Tabla
router.get("/grafica", verificarToken, obtenerGraficaAnual);
router.post("/ventas", verificarToken, crearVenta); // Crear
router.delete("/ventas/:id", verificarToken, eliminarVenta); // Borrar
router.put("/ventas/:id", verificarToken, actualizarVenta);
router.get("/distribucion", obtenerDistribucionFinanciera);
module.exports = router;

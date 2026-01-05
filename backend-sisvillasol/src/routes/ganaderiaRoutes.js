const express = require("express");
const router = express.Router();
const controller = require("../controllers/ganaderiaController");

router.get("/dashboard", controller.obtenerDashboard);
router.post("/animal", controller.crearAnimal);
router.post("/leche", controller.registrarLeche);
router.post("/insumo", controller.registrarInsumo);
router.post("/venta", controller.venderAnimal);
router.post("/pastoreo", controller.registrarPastoreo);
router.put("/animal/:id", controller.actualizarAnimal);
router.delete("/animal/:id", controller.eliminarAnimal);
router.put("/leche/:id", controller.actualizarLeche);
router.delete("/leche/:id", controller.eliminarLeche);
module.exports = router;

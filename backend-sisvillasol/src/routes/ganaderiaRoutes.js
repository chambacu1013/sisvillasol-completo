const express = require("express");
const router = express.Router();
const controller = require("../controllers/ganaderiaController");

router.get("/dashboard", controller.obtenerDashboard);
router.post("/animal", controller.crearAnimal);
router.post("/leche", controller.registrarLeche);
router.post("/insumo", controller.registrarInsumo);
router.post("/venta", controller.venderAnimal);
router.post("/pastoreo", controller.registrarPastoreo);

module.exports = router;

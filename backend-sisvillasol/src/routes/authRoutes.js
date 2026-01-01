const { Router } = require("express");
const router = Router();
const { login } = require("../controllers/authController");

// Ruta para hacer Login
router.post("/login", login);

module.exports = router;

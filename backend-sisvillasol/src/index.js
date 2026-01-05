const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Importar mis rutas
const usuariosRoutes = require("./routes/usuariosRoutes");
const authRoutes = require("./routes/authRoutes");
const lotesRoutes = require("./routes/lotesRoutes");
const insumosRoutes = require("./routes/insumosRoutes");
const ventasRoutes = require("./routes/ventasRoutes");
const empresaRoutes = require("./routes/empresaRoutes");
app.use(cors());
app.use(express.json()); // Importante para recibir datos en POST

// Usar las rutas
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/auth", authRoutes);
app.get("/", (req, res) => {
  res.send("Backend SISVILLASOL Funcionando");
});
app.use("/api/lotes", lotesRoutes);
app.use("/api/insumos", insumosRoutes);
app.use("/api/ventas", ventasRoutes);
app.use("/api/empresa", empresaRoutes);
app.use("/api/actividades", require("./routes/actividadesRoutes"));
app.use("/api/notas", require("./routes/notasRoutes"));
app.use("/api/finanzas", require("./routes/finanzasRoutes"));
app.use("/api/ganaderia", require("./routes/ganaderiaRoutes"));
app.listen(port, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${port}`);
});

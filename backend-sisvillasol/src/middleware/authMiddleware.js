const jwt = require("jsonwebtoken");

const verificarToken = (req, res, next) => {
  // 1. Leer el header "Authorization"
  const authHeader = req.header("Authorization");

  // 2. Si no trae nada, error 403 inmediato
  if (!authHeader)
    return res.status(403).json({ mensaje: "Acceso denegado: Falta el token" });

  // 3. El header viene como "Bearer laksjdflkasjd..." -> Quitamos la palabra "Bearer "
  const token = authHeader.split(" ")[1];

  if (!token)
    return res
      .status(403)
      .json({ mensaje: "Acceso denegado: Token mal formado" });

  try {
    // 4. Verificar firma con la clave secreta
    const verified = jwt.verify(token, "secreto_super_seguro"); // Ojo: Debe ser la misma clave que usaste en authController
    req.user = verified;
    next(); // ¡Pase adelante!
  } catch (error) {
    res.status(403).json({ mensaje: "Token inválido o expirado" });
  }
};

module.exports = verificarToken;

const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acceso denegado: formato de token incorrecto.' });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET.trim(); // Usamos la misma clave limpia

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      console.error("Error al verificar token:", err.message);
      return res.status(403).json({ message: 'Token no válido o expirado' });
    }
    req.user = user;
    next();
  });
}

module.exports = verifyToken;
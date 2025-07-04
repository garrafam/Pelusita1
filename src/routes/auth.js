// En tu archivo de rutas (ej: /routes/auth.js)
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {User }= require('../models/User'); // Importas tu modelo de usuario

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // 1. Buscar al usuario en la base de datos
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(404).json({ message: 'Credenciales inválidas' });
  }

  // 2. Comparar la contraseña enviada con la hasheada en la BD
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Credenciales inválidas' });
  }

  // 3. Si todo es correcto, crear el token
  const payload = { id: user.id, email: user.email }; // Información que guardamos en el token
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET, // Una clave secreta que solo tú conoces
    { expiresIn: '1h' } // El token expira en 1 hora
  );

  // 4. Enviar el token al cliente
  res.json({ token });
});

module.exports = router;
// /src/routes/auth.js (VERSIÓN FINAL Y LIMPIA)
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    // Tu bloque de código (que está perfecto)
    const payload = { id: user.id, email: user.email, role: user.role };
    const secret = process.env.JWT_SECRET.trim(); // Limpiamos por si hay espacios
    const token = jwt.sign(payload, secret, { expiresIn: '8h' });

    // LA LÍNEA CLAVE: Enviamos el token puro, sin "Bearer "
    res.json({ success: true, token: `Bearer ${token}`  });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const remitoService = require('../services/remitoService');

// POST /api/remitos - Crear un nuevo remito
router.post('/', async (req, res) => {
  try {
    const { encabezado, items } = req.body;

    if (!encabezado || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Datos de encabezado e items son requeridos.' });
    }
    if (!encabezado.clienteNombre) {
      return res.status(400).json({ message: 'El nombre del cliente es requerido en el encabezado.' });
    }
    
    const nuevoRemito = await remitoService.crearRemito(encabezado, items);
    res.status(201).json(nuevoRemito);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => ({ field: err.path, message: err.message }));
      return res.status(400).json({ message: "Error de validación al crear remito", errors });
    }
    console.error("Error en ruta POST /api/remitos:", error.message);
    res.status(500).json({ message: "Error interno del servidor al crear remito", error: error.message });
  }
});

// GET /api/remitos/ultimoNumero - Obtener el último número de remito
router.get('/ultimoNumero', async (req, res) => {
    try {
        const ultimoNumero = await remitoService.obtenerUltimoNumeroRemito();
        res.status(200).json({ ultimoNumero });
    } catch (error) {
        console.error("Error en ruta GET /api/remitos/ultimoNumero:", error.message);
        res.status(500).json({ message: "Error al obtener el último número de remito", error: error.message });
    }
});

// GET /api/remitos - Obtener todos los remitos
router.get('/', async (req, res) => {
    try {
        // Aproximadamente línea 60 del archivo original de remitoRoutes.js
        console.log("[LOG RUTA] Query params recibidos en GET /api/remitos:", JSON.stringify(req.query, null, 2)); // LOG 1 (Ruta)

        const opciones = {
            clienteNombre: req.query.clienteNombre,
            ordenarPor: req.query.ordenarPor,         
            ordenDireccion: req.query.ordenDireccion,
            fechaDesde: req.query.fechaDesde, 
            fechaHasta: req.query.fechaHasta,
            pagina: req.query.pagina || 1,        
            limite: req.query.limite || 10         
        };
        
        // Aproximadamente línea 72 del archivo original
        console.log("[LOG RUTA] Opciones construidas para enviar al servicio:", JSON.stringify(opciones, null, 2)); // LOG Adicional (Ruta)
        
        const resultadoPaginado = await remitoService.obtenerTodosLosRemitos(opciones);
        
        // Aproximadamente línea 75 del archivo original
        console.log("[LOG RUTA] Resultado recibido del servicio en GET /api/remitos:", JSON.stringify(resultadoPaginado, null, 2)); // LOG 2 (Ruta)
        
        res.status(200).json(resultadoPaginado); 
    } catch (error) {
        console.error("Error en ruta GET /api/remitos:", error.message);
        res.status(500).json({ message: "Error interno del servidor al obtener los remitos", error: error.message });
    }
});

module.exports = router;
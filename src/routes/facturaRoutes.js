// src/routes/facturaRoutes.js

const express = require('express');
const router = express.Router();
const facturaService = require('../services/facturaService');
//const verifyToken = require('../middleware/verifyToken');
// --- Ruta para CREAR una nueva factura (POST /api/facturas) ---
router.post('/', async (req, res, next) => {
    try {
        const nuevaFactura = await facturaService.crearFactura(req.body);
        res.status(201).json(nuevaFactura);
    } catch (error) {
        next(error);
    }
});

// --- Ruta para OBTENER LA LISTA de facturas (GET /api/facturas) ---
router.get('/', async (req, res, next) => {
    try {
        const resultado = await facturaService.obtenerTodasLasFacturas(req.query);
        res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
});

// --- RUTA PARA OBTENER UNA SOLA FACTURA (ESTA ES LA QUE FALTABA) ---
// Responde a: GET /api/facturas/1, GET /api/facturas/2, etc.
router.get('/:id', async (req, res, next) => {
    try {
        // req.params.id captura el número que viene en la URL
        const idFactura = req.params.id;
        const factura = await facturaService.obtenerFacturaPorId(idFactura);

        if (factura) {
            // Si la encuentra, la devuelve con un estado 200 OK
            res.status(200).json(factura);
        } else {
            // Si el servicio devuelve null, respondemos con 404 Not Found
            res.status(404).json({ message: 'Factura no encontrada con ese ID' });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;

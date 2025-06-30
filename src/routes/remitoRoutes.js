// src/routes/remitoRoutes.js

const express = require('express');
const router = express.Router();
const remitoService = require('../services/remitoService');

// --- RUTA PARA OBTENER EL ÚLTIMO NÚMERO (GET /api/remitos/ultimoNumero) ---
router.get('/ultimoNumero', async (req, res, next) => {
    try {
        const ultimoNumero = await remitoService.obtenerUltimoNumeroRemito();
        res.status(200).json({ ultimoNumero });
    } catch (error) {
        next(error);
    }
});

// --- RUTA PARA CREAR UN NUEVO REMITO (POST /api/remitos) ---
router.post('/', async (req, res, next) => {
    try {
        const nuevoRemito = await remitoService.crearRemito(req.body);
        res.status(201).json(nuevoRemito);
    } catch (error) {
        next(error);
    }
});

// --- RUTA PARA OBTENER LA LISTA DE REMITOS (ESTA ES LA QUE FALTABA) ---
// Responde a: GET /api/remitos
router.get('/', async (req, res, next) => {
    try {
        // Le pasamos los filtros de la URL (req.query) al servicio
        const resultado = await remitoService.obtenerTodosLosRemitos(req.query);
        res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
});

// --- RUTA PARA OBTENER UN SOLO REMITO POR SU ID ---
// Responde a: GET /api/remitos/9
router.get('/:id', async (req, res, next) => {
    try {
        const idRemito = req.params.id;
        const remito = await remitoService.obtenerRemitoPorId(idRemito);
        if (remito) {
            res.status(200).json(remito);
        } else {
            res.status(404).json({ message: 'Remito no encontrado' });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;

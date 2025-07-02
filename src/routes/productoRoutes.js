const express = require('express');
const router = express.Router();
const productoService = require('../services/productoService'); 
const verifyToken = require('../middleware/verifyToken'); 
// al inicio de productoRoutes.js
const { Producto } = require('../models'); // Importa el modelo específico

// POST /api/productos - Crear un nuevo producto
router.post('/', async (req, res) => {
    try {
        if (req.body.stock !== undefined && req.body.stock !== null && req.body.stock !== '') {
            req.body.stock = parseInt(req.body.stock, 10);
            if (isNaN(req.body.stock)) {
                 return res.status(400).json({ message: "Error de validación", errors: [{field: "stock", message: "El stock debe ser un número."}] });
            }
        } else if (req.body.stock === '') { 
            delete req.body.stock; 
        }
        if (req.body.codigoDeBarras) {
            req.body.codigoDeBarras = req.body.codigoDeBarras.trim();
            if (req.body.codigoDeBarras === "") {
                req.body.codigoDeBarras = null;
            }
        }
        const nuevoProducto = await productoService.crearProducto(req.body);
        res.status(201).json(nuevoProducto);
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const errors = error.errors.map(err => ({ 
                field: err.path || (err.fields ? err.fields.join(', ') : 'unknown_field'), 
                message: err.message 
            }));
            return res.status(400).json({ message: "Error de validación o restricción única", errors });
        }
        console.error("Error en ruta POST /api/productos:", error.message);
        res.status(500).json({ message: "Error interno del servidor al crear producto", error: error.message });
    }
});

// GET /api/productos - Obtener todos los productos (MODIFICADO para paginación y ordenamiento)
router.get('/', async (req, res) => {
    try {
        const opciones = {
            q: req.query.q, // Para búsqueda general
            ordenarPor: req.query.ordenarPor,
            ordenDireccion: req.query.ordenDireccion,
            pagina: req.query.pagina || 1,
            limite: req.query.limite || 10 // Límite por defecto para productos
        };
        const resultadoPaginado = await productoService.obtenerTodosLosProductos(opciones);
        res.status(200).json(resultadoPaginado);
    } catch (error) {
        console.error("Error en ruta GET /api/productos:", error.message);
        res.status(500).json({ message: "Error interno del servidor al obtener productos", error: error.message });
    }
});

// GET /api/productos/codigo/:codigoDeBarras - Obtener un producto por su código de barras
router.get('/codigo/:codigoDeBarras', async (req, res) => {
    try {
        const { codigoDeBarras } = req.params;
        if (!codigoDeBarras || codigoDeBarras.trim() === '') { 
            return res.status(400).json({ message: 'El código de barras es requerido y no puede estar vacío.' });
        }
        const producto = await productoService.obtenerProductoPorCodigoDeBarras(codigoDeBarras.trim());
        if (!producto) {
            return res.status(404).json({ message: 'Producto no encontrado con ese código de barras.' });
        }
        res.status(200).json(producto);
    } catch (error) {
        console.error(`Error en ruta GET /api/productos/codigo/${req.params.codigoDeBarras}:`, error.message);
        res.status(500).json({ message: "Error interno del servidor al obtener producto por código de barras", error: error.message });
    }
});

// GET /api/productos/:id - Obtener un producto por ID
router.get('/:id', async (req, res) => {
    try {
        const producto = await productoService.obtenerProductoPorId(req.params.id);
        if (!producto) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.status(200).json(producto);
    } catch (error) {
        console.error(`Error en ruta GET /api/productos/${req.params.id}:`, error.message);
        res.status(500).json({ message: "Error interno del servidor al obtener producto por ID", error: error.message });
    }
});


// PUT /api/productos/:id - Actualizar un producto
router.put('/:id', async (req, res) => {
    try {
        if (req.body.stock !== undefined && req.body.stock !== null && req.body.stock !== '') {
            req.body.stock = parseInt(req.body.stock, 10);
             if (isNaN(req.body.stock)) {
                 return res.status(400).json({ message: "Error de validación", errors: [{field: "stock", message: "El stock debe ser un número."}] });
            }
        } else if (req.body.stock === '') {
            delete req.body.stock; 
        }
        if (req.body.codigoDeBarras !== undefined) { 
            req.body.codigoDeBarras = req.body.codigoDeBarras ? req.body.codigoDeBarras.trim() : null;
            if (req.body.codigoDeBarras === "") {
                req.body.codigoDeBarras = null; 
            }
        }
        const productoActualizado = await productoService.actualizarProducto(req.params.id, req.body);
        if (!productoActualizado) {
            return res.status(404).json({ message: 'Producto no encontrado para actualizar' });
        }
        res.status(200).json(productoActualizado);
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const errors = error.errors.map(err => ({ 
                field: err.path || (err.fields ? err.fields.join(', ') : 'unknown_field'), 
                message: err.message 
            }));
            return res.status(400).json({ message: "Error de validación o restricción única al actualizar", errors });
        }
        console.error(`Error en ruta PUT /api/productos/${req.params.id}:`, error.message);
        res.status(500).json({ message: "Error interno del servidor al actualizar producto", error: error.message });
    }
});

// DELETE /api/productos/:id - Eliminar un producto
router.delete('/:id', async (req, res) => {
    try {
        const productoEliminado = await productoService.eliminarProducto(req.params.id);
        if (!productoEliminado) {
            return res.status(404).json({ message: 'Producto no encontrado para eliminar' });
        }
        res.status(200).json({ message: 'Producto eliminado exitosamente', producto: productoEliminado });
    } catch (error) {
        console.error(`Error en ruta DELETE /api/productos/${req.params.id}:`, error.message);
        res.status(500).json({ message: "Error interno del servidor al eliminar producto", error: error.message });
    }
});

module.exports = router;
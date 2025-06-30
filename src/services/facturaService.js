// src/services/facturaService.js

// Importamos el objeto 'db' que contiene todos nuestros modelos y la conexión.
const db = require('../models');
const { Op } = require("sequelize");

/**
 * Crea una nueva factura y sus items.
 */
const crearFactura = async (datosFactura) => {
    const t = await db.sequelize.transaction();
    try {
        const { encabezado, items } = datosFactura;

        if (!encabezado || !items || !Array.isArray(items) || items.length === 0) {
            throw new Error('Datos de factura incompletos: se requiere un encabezado y una lista de items.');
        }

        const nuevaFactura = await db.Factura.create({
            clienteNombre: encabezado.clienteNombre,
            clienteCUIT: encabezado.clienteCUIT,
            tipoComprobante: encabezado.tipoComprobante,
            subtotalSinIVA: encabezado.subtotalSinIVA,
            totalIVA: encabezado.totalIVA,
            totalConIVA: encabezado.totalConIVA
        }, { transaction: t });

        for (const item of items) {
            await db.FacturaItem.create({
                facturaId: nuevaFactura.id,
                productoId: item.productoId,
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario
            }, { transaction: t });

            const producto = await db.Producto.findByPk(item.productoId, { transaction: t });
            if (!producto || producto.stock < item.cantidad) {
                throw new Error(`Stock insuficiente para el producto: ${producto ? producto.nombre : 'ID desconocido'}`);
            }
            
            producto.stock -= item.cantidad;
            await producto.save({ transaction: t });
        }

        await t.commit();
        return db.Factura.findByPk(nuevaFactura.id, { include: { model: db.FacturaItem, as: 'items' } });

    } catch (error) {
        await t.rollback();
        console.error("Error al crear la factura:", error);
        throw error;
    }
};

/**
 * Obtiene todas las facturas con opciones de paginación y filtro.
 */
const obtenerTodasLasFacturas = async (opciones = {}) => {
    const { cliente, pagina = 1, limite = 10, ordenarPor = 'fecha', ordenDireccion = 'DESC' } = opciones;
    const offset = (parseInt(pagina) - 1) * parseInt(limite);
    const whereClause = {};

    if (cliente) {
        whereClause.clienteNombre = { [Op.like]: `%${cliente}%` };
    }

    const { count, rows } = await db.Factura.findAndCountAll({
        where: whereClause,
        limit: parseInt(limite),
        offset,
        order: [[ordenarPor, ordenDireccion]],
        distinct: true
    });

    return {
        totalItems: count,
        facturas: rows, // Corregido para que coincida con lo que el frontend podría esperar
        totalPaginas: Math.ceil(count / limite),
        paginaActual: parseInt(pagina)
    };
};

/**
 * Busca una factura por su ID, incluyendo sus items y los productos asociados.
 */
const obtenerFacturaPorId = async (id) => {
    return await db.Factura.findByPk(id, {
        include: [{
            model: db.FacturaItem,
            as: 'items',
            include: [{
                model: db.Producto,
                attributes: ['nombre', 'codigoDeBarras']
            }]
        }]
    });
};

// --- ¡ESTA ES LA CORRECCIÓN MÁS IMPORTANTE! ---
// Nos aseguramos de exportar TODAS las funciones que las rutas necesitan.
module.exports = {
    crearFactura,
    obtenerTodasLasFacturas,
    obtenerFacturaPorId
};

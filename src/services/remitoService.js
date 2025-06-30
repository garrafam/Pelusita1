// src/services/remitoService.js

const db = require('../models');
const { Op } = require('sequelize');

/**
 * Crea un nuevo remito.
 */
const crearRemito = async (datosRemito) => {
    const t = await db.sequelize.transaction();
    try {
        const { encabezado, items } = datosRemito;
        if (!encabezado || !items || !Array.isArray(items) || items.length === 0) {
            throw new Error('Datos de remito incompletos: se requiere un encabezado y una lista de items.');
        }

        const nuevoRemito = await db.Remito.create({
            clienteNombre: encabezado.clienteNombre,
            clienteCUIT: encabezado.clienteCUIT,
            subtotalSinIVA: encabezado.subtotalSinIVA,
            totalIVA: encabezado.totalIVA,
            totalConIVA: encabezado.totalConIVA,
        }, { transaction: t });

        const itemsPromesas = items.map(itemData =>
            db.RemitoItem.create({
                remitoId: nuevoRemito.id,
                productoId: itemData.productoId,
                cantidad: itemData.cantidad,
            }, { transaction: t })
        );
        
        await Promise.all(itemsPromesas);
        await t.commit();

        console.log(`Remito N° ${nuevoRemito.id} guardado exitosamente.`);
        return db.Remito.findByPk(nuevoRemito.id, { include: { model: db.RemitoItem, as: 'items' } });

    } catch (error) {
        await t.rollback();
        console.error('Error al crear remito en servicio:', error.message);
        throw error;
    }
};

/**
 * Busca un remito por su ID.
 */
const obtenerRemitoPorId = async (id) => {
    return await db.Remito.findByPk(id, {
        include: [{
            model: db.RemitoItem,
            as: 'items',
            include: [{ model: db.Producto, attributes: ['nombre', 'precio'] }]
        }]
    });
};

/**
 * Obtiene el número del último remito.
 */
const obtenerUltimoNumeroRemito = async () => {
    const ultimoRemito = await db.Remito.findOne({
        order: [['id', 'DESC']],
        attributes: ['id']
    });
    return ultimoRemito ? ultimoRemito.id : 0;
};

/**
 * Obtiene todos los remitos (con filtros y paginación).
 */
const obtenerTodosLosRemitos = async (opciones = {}) => {
    const { clienteNombre, ordenarPor, ordenDireccion, pagina = 1, limite = 10 } = opciones;
    const offset = (pagina - 1) * limite;
    const whereClause = {};

    if (clienteNombre) {
        whereClause.clienteNombre = { [Op.like]: `%${clienteNombre}%` };
    }

    let orderClause = [['fecha', 'DESC']];
    if (ordenarPor) {
        orderClause = [[ordenarPor, ordenDireccion || 'DESC']];
    }

    return await db.Remito.findAndCountAll({
        where: whereClause,
        order: orderClause,
        limit: parseInt(limite),
        offset: parseInt(offset),
        distinct: true
    });
};

// --- ¡ESTA ES LA CORRECCIÓN MÁS IMPORTANTE! ---
// Nos aseguramos de exportar TODAS las funciones que las rutas necesitan.
module.exports = {
    crearRemito,
    obtenerRemitoPorId,
    obtenerUltimoNumeroRemito,
    obtenerTodosLosRemitos
};

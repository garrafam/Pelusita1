// ---------------------------------------------------------------------------
// ARCHIVO: src/services/remitoService.js (MODIFICADO para count correcto)
// ---------------------------------------------------------------------------
const { Remito, RemitoItem, sequelize, Producto } = require('../models'); // Asegúrate que la ruta a tus modelos sea correcta
const { Op } = require('sequelize');

// ... (crearRemito y obtenerUltimoNumeroRemito sin cambios directos, pero mantenlos) ...
const crearRemito = async (datosRemitoEncabezado, itemsParaRemito) => {
  const t = await sequelize.transaction();
  try {
    const nuevoRemito = await Remito.create({
      clienteNombre: datosRemitoEncabezado.clienteNombre,
      clienteCUIT: datosRemitoEncabezado.clienteCUIT,
      destino: datosRemitoEncabezado.destino,
      subtotalSinIVA: datosRemitoEncabezado.subtotalSinIVA,
      totalIVA: datosRemitoEncabezado.totalIVA,
      totalConIVA: datosRemitoEncabezado.totalConIVA,
    }, { transaction: t });

    const itemsCreadosPromesas = itemsParaRemito.map(itemData => {
      return RemitoItem.create({
        remitoId: nuevoRemito.id,
        productoId: itemData.productoId,
        nombreProducto: itemData.nombreProducto,
        codigoDeBarrasProducto: itemData.codigoDeBarrasProducto,
        cantidad: itemData.cantidad,
        precioBaseUnitario: itemData.precioBaseUnitario,
        ivaUnitario: itemData.ivaUnitario,
        precioFinalUnitario: itemData.precioFinalUnitario,
        subtotalItemConIVA: itemData.subtotalItemConIVA,
      }, { transaction: t });
    });
    
    await Promise.all(itemsCreadosPromesas);
    await t.commit(); 

    const remitoCompleto = await Remito.findByPk(nuevoRemito.id, {
        include: [{ model: RemitoItem, as: 'items' }]
    });
    return remitoCompleto;

  } catch (error) {
    await t.rollback(); 
    console.error('Error al crear remito en servicio:', error.message);
    throw error;
  }
};

const obtenerUltimoNumeroRemito = async () => {
    try {
        const ultimoRemito = await Remito.findOne({
            order: [['id', 'DESC']],
            attributes: ['id']
        });
        return ultimoRemito ? ultimoRemito.id : 0;
    } catch (error) {
        console.error('Error al obtener el último número de remito:', error);
        throw error;
    }
};

/**
 * Obtiene todos los remitos guardados, con opción de filtrar, ordenar, paginar y calcular sumatorias.
 * @param {object} [opciones={}] - Objeto con filtros, ordenamiento y paginación. 
 * @returns {Promise<object>} Un objeto con { remitos, totalItems, totalPaginas, paginaActual, sumaTotalConIVA }.
 */
const obtenerTodosLosRemitos = async (opciones = {}) => { 
    try {
        const { 
            clienteNombre, 
            ordenarPor, 
            ordenDireccion, 
            fechaDesde, 
            fechaHasta,
            pagina = 1,      
            limite = 10      
        } = opciones;

        const offset = (pagina - 1) * limite; 

        const whereClause = {}; 

        if (clienteNombre && clienteNombre.trim() !== '') {
            whereClause.clienteNombre = {
                [Op.like]: `%${clienteNombre}%` 
            };
        }

        if (fechaDesde || fechaHasta) {
            whereClause.fecha = {};
            if (fechaDesde) {
                whereClause.fecha[Op.gte] = new Date(fechaDesde + "T00:00:00.000Z"); 
            }
            if (fechaHasta) {
                whereClause.fecha[Op.lte] = new Date(fechaHasta + "T23:59:59.999Z");
            }
        }

        let orderClause = [['fecha', 'DESC']]; 
        if (ordenarPor && ordenDireccion) {
            const camposValidosParaOrdenar = ['id', 'fecha', 'clienteNombre']; 
            if (camposValidosParaOrdenar.includes(ordenarPor)) {
                const direccionValida = ['ASC', 'DESC'].includes(ordenDireccion.toUpperCase()) ? ordenDireccion.toUpperCase() : 'DESC';
                orderClause = [[ordenarPor, direccionValida]];
                if (ordenarPor === 'clienteNombre') {
                    orderClause.push(['fecha', 'DESC']);
                }
            } else {
                console.warn(`Intento de ordenar por campo no válido: ${ordenarPor}. Usando orden por defecto.`);
            }
        }
        
        const { count, rows } = await Remito.findAndCountAll({
            include: [
                {
                    model: RemitoItem,
                    as: 'items',
                    // attributes: [] // Opcional: si solo necesitas el count y no los items en esta consulta específica para el count
                }
            ],
            where: whereClause, 
            order: orderClause,
            limit: parseInt(limite, 10),    
            offset: parseInt(offset, 10),
            distinct: true, // Asegura que se cuenten los remitos distintos
            col: 'id'       // Columna para hacer el distinct (clave primaria de Remito)
            // Si 'items' no es required (left join), distinct y col podrían no ser necesarios
            // o podrían necesitar subQuery: false dependiendo de la complejidad.
            // Pero para un simple hasMany, distinct y col suelen ser la solución.
        });
        
        const sumaTotal = await Remito.sum('totalConIVA', { where: whereClause });

        return {
            remitos: rows,
            totalItems: count, // Este count ahora debería ser el de los Remitos distintos
            totalPaginas: Math.ceil(count / limite),
            paginaActual: parseInt(pagina, 10),
            sumaTotalConIVA: sumaTotal || 0 
        };

    } catch (error) {
        console.error('Error al obtener todos los remitos:', error.message);
        throw error;
    }
};


module.exports = {
  crearRemito,
  obtenerUltimoNumeroRemito,
  obtenerTodosLosRemitos
};

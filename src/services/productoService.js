const {Producto} = require('../models'); // Asegúrate que la ruta al modelo sea correcta
const { Op } = require('sequelize');


/**
 * Crea un nuevo producto en la base de datos.
 */
const crearProducto = async (datosProducto) => {
    try {
        const nuevoProducto = await Producto.create(datosProducto);
        return nuevoProducto;
    } catch (error) {
        throw error;
    }
};

/**
 * Obtiene todos los productos de la base de datos, con opción de búsqueda, ordenamiento y paginación.
 * @param {object} [opciones={}] - Objeto con filtros, ordenamiento y paginación. 
 * Ejemplo: { q: "término", ordenarPor: "nombre", ordenDireccion: "ASC", pagina: 1, limite: 10 }
 * @returns {Promise<object>} Un objeto con { productos, totalItems, totalPaginas, paginaActual }.
 */
// En /services/productoService.js

// Asegúrate de tener estas importaciones al principio del archivo


const obtenerTodosLosProductos = async (opciones = {}, user) => {
    // --- INICIO DE LA INTEGRACIÓN DE SEGURIDAD ---
    // 1. Verificamos que el usuario exista y tenga el rol correcto.
    if (!user || user.role !== 'admin') {
        const error = new Error('403: Permiso denegado. Se requiere rol de administrador.');
        error.status = 403; // Adjuntamos un status para que la ruta lo pueda usar si quiere
        throw error;
    }
    // --- FIN DE LA INTEGRACIÓN DE SEGURIDAD ---

    // Si el chequeo pasa, el resto de tu código se ejecuta sin cambios.
    try {
        const { 
            q: terminoBusqueda,
            ordenarPor, 
            ordenDireccion,
            pagina = 1,
            limite = 10
        } = opciones;

        const offset = (parseInt(pagina, 10) - 1) * parseInt(limite, 10);

        const findOptions = {
            where: {},
            order: [['nombre', 'ASC']],
            limit: parseInt(limite, 10),
            offset: offset
        };

        if (terminoBusqueda && terminoBusqueda.trim() !== '') {
            const termino = `%${terminoBusqueda}%`;
            findOptions.where = {
                [Op.or]: [ 
                    { nombre: { [Op.like]: termino } }, 
                    { categoria: { [Op.like]: termino } },
                    { codigoDeBarras: { [Op.like]: termino } }
                ]
            };
        }

        if (ordenarPor && ordenDireccion) {
            const camposValidosParaOrdenar = ['nombre', 'precio', 'stock', 'categoria', 'id', 'codigoDeBarras']; 
            if (camposValidosParaOrdenar.includes(ordenarPor)) {
                const direccionValida = ['ASC', 'DESC'].includes(ordenDireccion.toUpperCase()) ? ordenDireccion.toUpperCase() : 'ASC';
                findOptions.order = [[ordenarPor, direccionValida]];
                if (ordenarPor !== 'nombre') {
                    findOptions.order.push(['nombre', 'ASC']);
                }
            } else {
                console.warn(`Intento de ordenar por campo no válido: ${ordenarPor}.`);
            }
        }
        
        const { count, rows } = await Producto.findAndCountAll(findOptions);
        
        return {
            productos: rows,
            totalItems: count,
            totalPaginas: Math.ceil(count / limite),
            paginaActual: parseInt(pagina, 10)
        };

    } catch (error) {
        // Si el error ya tiene un status (como nuestro 403), lo mantenemos. Si no, es un 500.
        if (!error.status) {
             console.error('Servicio: Error al obtener todos los productos:', error.message);
        }
        throw error; // Relanzamos el error para que la ruta lo capture.
    }
};

// No olvides exportar la función
module.exports = {
    obtenerTodosLosProductos,
    // ... tus otras funciones del servicio ...
};

/**
 * Obtiene un producto por su ID.
 */
const obtenerProductoPorId = async (id) => {
    try {
        const producto = await Producto.findByPk(id);
        return producto;
    } catch (error) {
        throw error;
    }
};

/**
 * Obtiene un producto por su código de barras.
 */
const obtenerProductoPorCodigoDeBarras = async (codigoDeBarras) => { 
    try {
        if (!codigoDeBarras || codigoDeBarras.trim() === '') {
            return null; 
        }
        const producto = await Producto.findOne({ 
            where: { codigoDeBarras: codigoDeBarras.trim() } 
        });
        return producto;
    } catch (error) {
        console.error('Servicio: Error al obtener producto por código de barras:', error.message);
        throw error;
    }
};


/**
 * Actualiza un producto existente por su ID.
 */
const actualizarProducto = async (id, datosActualizados) => {
    try {
        const producto = await Producto.findByPk(id);
        if (!producto) return null;
        
        if (datosActualizados.nombre !== undefined) producto.nombre = datosActualizados.nombre;
        if (datosActualizados.precio !== undefined) producto.precio = datosActualizados.precio;
        if (datosActualizados.categoria !== undefined) producto.categoria = datosActualizados.categoria;
        if (datosActualizados.stock !== undefined) producto.stock = datosActualizados.stock;
        if (datosActualizados.codigoDeBarras !== undefined) {
            producto.codigoDeBarras = datosActualizados.codigoDeBarras ? datosActualizados.codigoDeBarras.trim() : null;
        }
        
        await producto.save();
        return producto;
    } catch (error) {
        throw error;
    }
};

/**
 * Elimina un producto por su ID.
 */
const eliminarProducto = async (id) => {
    try {
        const producto = await Producto.findByPk(id);
        if (!producto) return null;
        await producto.destroy();
        return producto;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    crearProducto,
    obtenerTodosLosProductos, // Modificada
    obtenerProductoPorId,
    obtenerProductoPorCodigoDeBarras,
    actualizarProducto,
    eliminarProducto
};
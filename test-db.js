// test-db.js
const { User } = require('./src/models');

async function findUser() {
  try {
    console.log('--- Iniciando prueba de base de datos ---');
    const emailToFind = '1@marcos.com';
    console.log(`Buscando usuario con email: ${emailToFind}`);

    const user = await User.findOne({ where: { email: emailToFind } });

    if (user) {
      console.log('✅ ¡ÉXITO! Usuario encontrado:');
      console.log(user.toJSON());
    } else {
      console.log('❌ FALLO: No se encontró ningún usuario con ese email.');
    }
  } catch (error) {
    console.error('🔥 ERROR CATASTRÓFICO EN LA PRUEBA:', error);
  }
}

findUser();
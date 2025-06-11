require('dotenv').config();
const mysql = require('mysql2/promise');

let db;

async function initDatabase() {
  try {
    console.log('🔗 Conectando ao MySQL...');
    
    // Conectar sem especificar banco para criá-lo
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      charset: 'utf8mb4'
    });

    // Criar banco
    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS estevan_hub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await tempConnection.end();

    // Conectar ao banco específico
    db = await mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: 'estevan_hub',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4'
    });

    // Testar conexão
    await db.execute('SELECT 1');
    console.log('✅ Database conectado com sucesso');
    
    return db;
  } catch (error) {
    console.error('❌ Erro no banco:', error.message);
    throw error;
  }
}

async function executeQuery(query, params = []) {
  try {
    return await db.execute(query, params);
  } catch (error) {
    console.error('Query Error:', error.message);
    throw error;
  }
}

module.exports = {
  initDatabase,
  executeQuery
};

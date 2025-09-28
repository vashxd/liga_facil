const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Função para conectar ao banco
async function connectDB() {
  try {
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados SQLite');
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error);
    process.exit(1);
  }
}

// Função para desconectar do banco
async function disconnectDB() {
  await prisma.$disconnect();
  console.log('🔌 Desconectado do banco de dados');
}

module.exports = {
  prisma,
  connectDB,
  disconnectDB
};
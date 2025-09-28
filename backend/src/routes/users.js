const express = require('express');
const { prisma } = require('../utils/prisma');
const auth = require('../middleware/auth');

const router = express.Router();

// Todas as rotas precisam de autenticação
router.use(auth);

// GET /api/users/profile - Obter perfil do usuário
router.get('/profile', async (req, res) => {
  try {
    const user = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        nome: true,
        email: true,
        dataCadastro: true,
        _count: {
          select: {
            timesOrganizados: true,
            campeonatosOrganizados: true
          }
        }
      }
    });

    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/users/profile - Atualizar perfil do usuário
router.put('/profile', async (req, res) => {
  try {
    const { nome } = req.body;
    const userId = req.user.id;

    const updatedUser = await prisma.usuario.update({
      where: { id: userId },
      data: { nome },
      select: {
        id: true,
        nome: true,
        email: true,
        dataCadastro: true
      }
    });

    res.json({
      message: 'Perfil atualizado com sucesso',
      user: updatedUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
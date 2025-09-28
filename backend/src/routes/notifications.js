const express = require('express');
const { prisma } = require('../utils/prisma');
const auth = require('../middleware/auth');

const router = express.Router();

// Todas as rotas precisam de autenticação
router.use(auth);

// GET /api/notifications - Listar notificações do usuário
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      usuarioId: userId,
      ...(unreadOnly === 'true' && { lida: false })
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notificacao.findMany({
        where,
        orderBy: { dataEnvio: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.notificacao.count({ where }),
      prisma.notificacao.count({
        where: { usuarioId: userId, lida: false }
      })
    ]);

    res.json({
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/notifications/:id/read - Marcar notificação como lida
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await prisma.notificacao.findFirst({
      where: {
        id: parseInt(id),
        usuarioId: userId
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    await prisma.notificacao.update({
      where: { id: parseInt(id) },
      data: { lida: true }
    });

    res.json({ message: 'Notificação marcada como lida' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/notifications/read-all - Marcar todas as notificações como lidas
router.put('/read-all', async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.notificacao.updateMany({
      where: {
        usuarioId: userId,
        lida: false
      },
      data: { lida: true }
    });

    res.json({ message: 'Todas as notificações foram marcadas como lidas' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
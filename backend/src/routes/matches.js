const express = require('express');
const {
  getMatchesByChampionship,
  getMatchById,
  updateMatchStatus,
  updateMatchResult,
  updateMatchDateTime,
  updateResultValidation,
  processNextPhase
} = require('../controllers/matchController');
const auth = require('../middleware/auth');
const { prisma } = require('../utils/prisma');

const router = express.Router();

// Todas as rotas precisam de autenticação
router.use(auth);

// GET /api/matches/championship/:championshipId - Listar partidas de um campeonato
router.get('/championship/:championshipId', getMatchesByChampionship);

// GET /api/matches/:id - Obter detalhes de uma partida
router.get('/:id', getMatchById);

// POST /api/matches - Criar partida
router.post('/', async (req, res) => {
  try {
    const { campeonatoId, timeCasaId, timeVisitanteId, dataHora, local, fase } = req.body;
    const userId = req.user.id;

    // Verificar se o usuário é organizador do campeonato
    const championship = await prisma.campeonato.findFirst({
      where: {
        id: parseInt(campeonatoId),
        organizadorId: userId
      }
    });

    if (!championship) {
      return res.status(403).json({ error: 'Você não tem permissão para criar partidas neste campeonato' });
    }

    const match = await prisma.partida.create({
      data: {
        campeonatoId: parseInt(campeonatoId),
        timeCasaId: parseInt(timeCasaId),
        timeVisitanteId: parseInt(timeVisitanteId),
        dataHora: new Date(dataHora),
        local,
        fase
      },
      include: {
        timeCasa: true,
        timeVisitante: true,
        campeonato: {
          select: { nome: true }
        }
      }
    });

    res.status(201).json({
      message: 'Partida criada com sucesso',
      match
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/matches/:id/result - Registrar resultado da partida
router.put('/:id/result', updateResultValidation, updateMatchResult);

// PUT /api/matches/:id/status - Atualizar status da partida
router.put('/:id/status', updateMatchStatus);

// PUT /api/matches/:id/datetime - Atualizar data/hora da partida
router.put('/:id/datetime', updateMatchDateTime);

// POST /api/matches/championship/:championshipId/process-next-phase - Processar próxima fase manualmente
router.post('/championship/:championshipId/process-next-phase', processNextPhase);

module.exports = router;
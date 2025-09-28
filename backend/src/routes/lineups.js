const express = require('express');
const {
  createOrUpdateLineup,
  getLineup,
  getMatchLineups,
  deleteLineup,
  lineupValidation
} = require('../controllers/lineupController');
const auth = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de escalação precisam de autenticação
router.use(auth);

// POST /api/lineups - Criar/atualizar escalação
router.post('/', lineupValidation, createOrUpdateLineup);

// GET /api/lineups/match/:partidaId - Obter todas as escalações de uma partida
router.get('/match/:partidaId', getMatchLineups);

// GET /api/lineups/:partidaId/:timeId - Obter escalação específica
router.get('/:partidaId/:timeId', getLineup);

// DELETE /api/lineups/:partidaId/:timeId - Remover escalação
router.delete('/:partidaId/:timeId', deleteLineup);

module.exports = router;
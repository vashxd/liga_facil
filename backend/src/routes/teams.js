const express = require('express');
const {
  createTeam,
  getUserTeams,
  getTeamById,
  addPlayer,
  removePlayer,
  updateTeam,
  createTeamValidation,
  addPlayerValidation
} = require('../controllers/teamController');
const auth = require('../middleware/auth');

const router = express.Router();

// Todas as rotas precisam de autenticação
router.use(auth);

// GET /api/teams - Listar times do usuário
router.get('/', getUserTeams);

// POST /api/teams - Criar time
router.post('/', createTeamValidation, createTeam);

// GET /api/teams/:id - Obter detalhes de um time
router.get('/:id', getTeamById);

// PUT /api/teams/:id - Atualizar time
router.put('/:id', updateTeam);

// POST /api/teams/:id/players - Adicionar jogador ao time
router.post('/:id/players', addPlayerValidation, addPlayer);

// DELETE /api/teams/:id/players/:playerId - Remover jogador do time
router.delete('/:id/players/:playerId', removePlayer);

module.exports = router;
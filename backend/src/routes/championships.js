const express = require('express');
const {
  createChampionship,
  getPublicChampionships,
  getUserChampionships,
  getChampionshipById,
  getChampionshipByCode,
  enrollTeam,
  updateChampionship,
  generateMatches,
  getChampionshipStandings,
  createChampionshipValidation
} = require('../controllers/championshipController');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/championships/public - Listar campeonatos públicos (sem autenticação)
router.get('/public', getPublicChampionships);

// GET /api/championships/code/:code - Acessar campeonato privado via código (sem autenticação)
router.get('/code/:code', getChampionshipByCode);

// Rotas que precisam de autenticação
router.use(auth);

// GET /api/championships - Listar campeonatos do usuário
router.get('/', getUserChampionships);

// POST /api/championships - Criar campeonato
router.post('/', createChampionshipValidation, createChampionship);

// POST /api/championships/:id/enroll - Inscrever time em campeonato
router.post('/:id/enroll', enrollTeam);

// POST /api/championships/:id/generate-matches - Gerar chaves do campeonato
router.post('/:id/generate-matches', generateMatches);

// GET /api/championships/:id/standings - Obter classificação do campeonato
router.get('/:id/standings', getChampionshipStandings);

// PUT /api/championships/:id - Atualizar campeonato
router.put('/:id', updateChampionship);

// GET /api/championships/:id - Obter detalhes de um campeonato (sem autenticação, mas pode estar após auth para dar prioridade às rotas específicas)
router.get('/:id', getChampionshipById);

module.exports = router;
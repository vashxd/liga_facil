const { body, validationResult } = require('express-validator');
const { prisma } = require('../utils/prisma');

// Validações
const createTeamValidation = [
  body('nome').notEmpty().withMessage('Nome do time é obrigatório'),
  body('nome').isLength({ min: 2, max: 50 }).withMessage('Nome deve ter entre 2 e 50 caracteres')
];

const addPlayerValidation = [
  body('nome').notEmpty().withMessage('Nome do jogador é obrigatório'),
  body('posicao').notEmpty().withMessage('Posição é obrigatória'),
  body('numero').isInt({ min: 1, max: 99 }).withMessage('Número deve ser entre 1 e 99')
];

// Criar time
const createTeam = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nome, escudo } = req.body;
    const userId = req.user.id;

    const team = await prisma.time.create({
      data: {
        nome,
        escudo,
        criadorId: userId
      },
      include: {
        criador: {
          select: { id: true, nome: true, email: true }
        },
        jogadores: true
      }
    });

    res.status(201).json({
      message: 'Time criado com sucesso',
      team
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Listar times do usuário
const getUserTeams = async (req, res) => {
  try {
    const userId = req.user.id;

    const teams = await prisma.time.findMany({
      where: { criadorId: userId },
      include: {
        jogadores: true,
        _count: {
          select: { jogadores: true }
        }
      },
      orderBy: { dataCriacao: 'desc' }
    });

    res.json({ teams });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter detalhes de um time
const getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const team = await prisma.time.findFirst({
      where: {
        id: parseInt(id),
        criadorId: userId
      },
      include: {
        criador: {
          select: { id: true, nome: true, email: true }
        },
        jogadores: {
          orderBy: { numero: 'asc' }
        }
      }
    });

    if (!team) {
      return res.status(404).json({ error: 'Time não encontrado' });
    }

    res.json({ team });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Adicionar jogador ao time
const addPlayer = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { nome, posicao, numero } = req.body;
    const userId = req.user.id;

    // Verificar se o time pertence ao usuário
    const team = await prisma.time.findFirst({
      where: {
        id: parseInt(id),
        criadorId: userId
      }
    });

    if (!team) {
      return res.status(404).json({ error: 'Time não encontrado' });
    }

    // Verificar se o número já está sendo usado no time
    const existingPlayer = await prisma.jogador.findFirst({
      where: {
        timeId: parseInt(id),
        numero: parseInt(numero)
      }
    });

    if (existingPlayer) {
      return res.status(400).json({ error: 'Número já está sendo usado por outro jogador' });
    }

    const player = await prisma.jogador.create({
      data: {
        nome,
        posicao,
        numero: parseInt(numero),
        timeId: parseInt(id)
      }
    });

    res.status(201).json({
      message: 'Jogador adicionado com sucesso',
      player
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Remover jogador do time
const removePlayer = async (req, res) => {
  try {
    const { id, playerId } = req.params;
    const userId = req.user.id;

    // Verificar se o time pertence ao usuário
    const team = await prisma.time.findFirst({
      where: {
        id: parseInt(id),
        criadorId: userId
      }
    });

    if (!team) {
      return res.status(404).json({ error: 'Time não encontrado' });
    }

    // Verificar se o jogador existe no time
    const player = await prisma.jogador.findFirst({
      where: {
        id: parseInt(playerId),
        timeId: parseInt(id)
      }
    });

    if (!player) {
      return res.status(404).json({ error: 'Jogador não encontrado no time' });
    }

    await prisma.jogador.delete({
      where: { id: parseInt(playerId) }
    });

    res.json({ message: 'Jogador removido com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar time
const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, escudo } = req.body;
    const userId = req.user.id;

    // Verificar se o time pertence ao usuário
    const existingTeam = await prisma.time.findFirst({
      where: {
        id: parseInt(id),
        criadorId: userId
      }
    });

    if (!existingTeam) {
      return res.status(404).json({ error: 'Time não encontrado' });
    }

    const updatedTeam = await prisma.time.update({
      where: { id: parseInt(id) },
      data: {
        ...(nome && { nome }),
        ...(escudo && { escudo })
      },
      include: {
        criador: {
          select: { id: true, nome: true, email: true }
        },
        jogadores: {
          orderBy: { numero: 'asc' }
        }
      }
    });

    res.json({
      message: 'Time atualizado com sucesso',
      team: updatedTeam
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  createTeam,
  getUserTeams,
  getTeamById,
  addPlayer,
  removePlayer,
  updateTeam,
  createTeamValidation,
  addPlayerValidation
};
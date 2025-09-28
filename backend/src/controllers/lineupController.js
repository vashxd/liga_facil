const { prisma } = require('../utils/prisma');
const { validationResult, body } = require('express-validator');

// Validação para criar/atualizar escalação
const lineupValidation = [
  body('partidaId').isInt().withMessage('ID da partida é obrigatório'),
  body('timeId').isInt().withMessage('ID do time é obrigatório'),
  body('formacao').notEmpty().withMessage('Formação é obrigatória'),
  body('titulares').isArray({ min: 11, max: 11 }).withMessage('Deve ter exatamente 11 titulares'),
  body('reservas').isArray({ max: 7 }).withMessage('Máximo 7 reservas'),
  body('titulares.*.jogadorId').isInt().withMessage('ID do jogador é obrigatório'),
  body('reservas.*.jogadorId').isInt().withMessage('ID do jogador é obrigatório')
];

// Criar/Atualizar escalação
const createOrUpdateLineup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { partidaId, timeId, formacao, titulares, reservas } = req.body;
    const userId = req.user.id;

    // Verificar se o usuário é o dono do time
    const team = await prisma.time.findFirst({
      where: {
        id: timeId,
        criadorId: userId
      }
    });

    if (!team) {
      return res.status(403).json({ error: 'Você não tem permissão para gerenciar este time' });
    }

    // Verificar se a partida existe e o time está nela
    const match = await prisma.partida.findFirst({
      where: {
        id: partidaId,
        OR: [
          { timeCasaId: timeId },
          { timeVisitanteId: timeId }
        ]
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Partida não encontrada ou time não participa desta partida' });
    }

    // Verificar se todos os jogadores pertencem ao time
    const allPlayers = [...titulares, ...reservas];
    const playerIds = allPlayers.map(p => p.jogadorId);

    const playersInTeam = await prisma.jogador.findMany({
      where: {
        id: { in: playerIds },
        timeId: timeId
      }
    });

    if (playersInTeam.length !== playerIds.length) {
      return res.status(400).json({ error: 'Alguns jogadores não pertencem a este time' });
    }

    // Verificar se não há jogadores duplicados
    const uniquePlayerIds = new Set(playerIds);
    if (uniquePlayerIds.size !== playerIds.length) {
      return res.status(400).json({ error: 'Não é possível escalar o mesmo jogador mais de uma vez' });
    }

    // Validar formação básica (deve ter 1 goleiro nos titulares)
    const goalkeepers = await prisma.jogador.findMany({
      where: {
        id: { in: titulares.map(t => t.jogadorId) },
        posicao: 'Goleiro'
      }
    });

    if (goalkeepers.length !== 1) {
      return res.status(400).json({ error: 'Deve haver exatamente 1 goleiro entre os titulares' });
    }

    // Remover escalação anterior (se existir)
    await prisma.escalacao.deleteMany({
      where: {
        partidaId: partidaId,
        timeId: timeId
      }
    });

    // Criar novas escalações
    const lineupData = [
      ...titulares.map(titular => ({
        partidaId,
        timeId,
        jogadorId: titular.jogadorId,
        formacao,
        titular: true
      })),
      ...reservas.map(reserva => ({
        partidaId,
        timeId,
        jogadorId: reserva.jogadorId,
        formacao,
        titular: false
      }))
    ];

    await prisma.escalacao.createMany({
      data: lineupData
    });

    // Buscar escalação criada para retornar
    const lineup = await prisma.escalacao.findMany({
      where: {
        partidaId,
        timeId
      },
      include: {
        jogador: {
          select: {
            id: true,
            nome: true,
            posicao: true,
            numero: true
          }
        }
      },
      orderBy: [
        { titular: 'desc' },
        { jogador: { numero: 'asc' } }
      ]
    });

    res.status(201).json({
      message: 'Escalação definida com sucesso',
      lineup: {
        partidaId,
        timeId,
        formacao,
        titulares: lineup.filter(l => l.titular),
        reservas: lineup.filter(l => !l.titular)
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter escalação de um time para uma partida
const getLineup = async (req, res) => {
  try {
    const { partidaId, timeId } = req.params;

    const lineup = await prisma.escalacao.findMany({
      where: {
        partidaId: parseInt(partidaId),
        timeId: parseInt(timeId)
      },
      include: {
        jogador: {
          select: {
            id: true,
            nome: true,
            posicao: true,
            numero: true
          }
        }
      },
      orderBy: [
        { titular: 'desc' },
        { jogador: { numero: 'asc' } }
      ]
    });

    if (lineup.length === 0) {
      return res.status(404).json({ error: 'Escalação não encontrada' });
    }

    const formacao = lineup[0].formacao;

    res.json({
      lineup: {
        partidaId: parseInt(partidaId),
        timeId: parseInt(timeId),
        formacao,
        titulares: lineup.filter(l => l.titular),
        reservas: lineup.filter(l => !l.titular)
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter todas as escalações de uma partida
const getMatchLineups = async (req, res) => {
  try {
    const { partidaId } = req.params;

    const lineups = await prisma.escalacao.findMany({
      where: {
        partidaId: parseInt(partidaId)
      },
      include: {
        jogador: {
          select: {
            id: true,
            nome: true,
            posicao: true,
            numero: true
          }
        },
        time: {
          select: {
            id: true,
            nome: true,
            escudo: true
          }
        }
      },
      orderBy: [
        { timeId: 'asc' },
        { titular: 'desc' },
        { jogador: { numero: 'asc' } }
      ]
    });

    // Agrupar por time
    const lineupsByTeam = lineups.reduce((acc, lineup) => {
      const teamId = lineup.timeId;
      if (!acc[teamId]) {
        acc[teamId] = {
          time: lineup.time,
          formacao: lineup.formacao,
          titulares: [],
          reservas: []
        };
      }

      if (lineup.titular) {
        acc[teamId].titulares.push(lineup);
      } else {
        acc[teamId].reservas.push(lineup);
      }

      return acc;
    }, {});

    res.json({
      partidaId: parseInt(partidaId),
      lineups: Object.values(lineupsByTeam)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Remover escalação
const deleteLineup = async (req, res) => {
  try {
    const { partidaId, timeId } = req.params;
    const userId = req.user.id;

    // Verificar se o usuário é o dono do time
    const team = await prisma.time.findFirst({
      where: {
        id: parseInt(timeId),
        criadorId: userId
      }
    });

    if (!team) {
      return res.status(403).json({ error: 'Você não tem permissão para gerenciar este time' });
    }

    const deleted = await prisma.escalacao.deleteMany({
      where: {
        partidaId: parseInt(partidaId),
        timeId: parseInt(timeId)
      }
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Escalação não encontrada' });
    }

    res.json({ message: 'Escalação removida com sucesso' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  createOrUpdateLineup,
  getLineup,
  getMatchLineups,
  deleteLineup,
  lineupValidation
};
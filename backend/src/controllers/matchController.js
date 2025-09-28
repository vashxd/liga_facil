const { body, validationResult } = require('express-validator');
const { prisma } = require('../utils/prisma');

// Validações
const updateResultValidation = [
  body('golsTimeCasa').isInt({ min: 0 }).withMessage('Gols do time da casa devem ser um número não negativo'),
  body('golsTimeVisitante').isInt({ min: 0 }).withMessage('Gols do time visitante devem ser um número não negativo')
];

// Obter partidas de um campeonato
const getMatchesByChampionship = async (req, res) => {
  try {
    const { championshipId } = req.params;

    const matches = await prisma.partida.findMany({
      where: { campeonatoId: parseInt(championshipId) },
      include: {
        timeCasa: {
          select: { id: true, nome: true, escudo: true }
        },
        timeVisitante: {
          select: { id: true, nome: true, escudo: true }
        },
        resultado: true,
        campeonato: {
          select: { nome: true, organizadorId: true }
        }
      },
      orderBy: [
        { fase: 'asc' },
        { dataHora: 'asc' }
      ]
    });

    res.json({ matches });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter detalhes de uma partida
const getMatchById = async (req, res) => {
  try {
    const { id } = req.params;

    const match = await prisma.partida.findUnique({
      where: { id: parseInt(id) },
      include: {
        timeCasa: {
          include: {
            jogadores: true
          }
        },
        timeVisitante: {
          include: {
            jogadores: true
          }
        },
        resultado: true,
        campeonato: {
          select: { nome: true, organizadorId: true }
        }
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Partida não encontrada' });
    }

    res.json({ match });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar status da partida
const updateMatchStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // Verificar se a partida existe e se o usuário é o organizador do campeonato
    const match = await prisma.partida.findUnique({
      where: { id: parseInt(id) },
      include: {
        campeonato: true
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Partida não encontrada' });
    }

    if (match.campeonato.organizadorId !== userId) {
      return res.status(403).json({ error: 'Apenas o organizador do campeonato pode alterar o status das partidas' });
    }

    const updatedMatch = await prisma.partida.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        timeCasa: {
          select: { id: true, nome: true, escudo: true }
        },
        timeVisitante: {
          select: { id: true, nome: true, escudo: true }
        },
        resultado: true
      }
    });

    res.json({
      message: 'Status da partida atualizado com sucesso',
      match: updatedMatch
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Registrar resultado da partida
const updateMatchResult = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { golsTimeCasa, golsTimeVisitante, observacoes } = req.body;
    const userId = req.user.id;

    // Verificar se a partida existe e se o usuário é o organizador do campeonato
    const match = await prisma.partida.findUnique({
      where: { id: parseInt(id) },
      include: {
        campeonato: true,
        resultado: true
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Partida não encontrada' });
    }

    if (match.campeonato.organizadorId !== userId) {
      return res.status(403).json({ error: 'Apenas o organizador do campeonato pode registrar resultados' });
    }

    await prisma.$transaction(async (tx) => {
      // Criar ou atualizar resultado
      if (match.resultado) {
        await tx.resultado.update({
          where: { partidaId: match.id },
          data: {
            golsTimeCasa: parseInt(golsTimeCasa),
            golsTimeVisitante: parseInt(golsTimeVisitante),
            observacoes
          }
        });
      } else {
        await tx.resultado.create({
          data: {
            partidaId: match.id,
            golsTimeCasa: parseInt(golsTimeCasa),
            golsTimeVisitante: parseInt(golsTimeVisitante),
            observacoes
          }
        });
      }

      // Atualizar status da partida para finalizada
      await tx.partida.update({
        where: { id: match.id },
        data: { status: 'FINALIZADA' }
      });

      // Atualizar classificações se for pontos corridos
      if (match.campeonato.formato === 'PONTOS_CORRIDOS') {
        await updateStandings(tx, match.campeonatoId, match.timeCasaId, match.timeVisitanteId, golsTimeCasa, golsTimeVisitante);
      }
    });

    // Buscar partida atualizada
    const updatedMatch = await prisma.partida.findUnique({
      where: { id: parseInt(id) },
      include: {
        timeCasa: {
          select: { id: true, nome: true, escudo: true }
        },
        timeVisitante: {
          select: { id: true, nome: true, escudo: true }
        },
        resultado: true
      }
    });

    res.json({
      message: 'Resultado registrado com sucesso',
      match: updatedMatch
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Função auxiliar para atualizar classificações
const updateStandings = async (tx, championshipId, homeTeamId, awayTeamId, homeGoals, awayGoals) => {
  // Determinar resultado
  let homePoints = 0;
  let awayPoints = 0;
  let homeWins = 0, homeDraws = 0, homeLosses = 0;
  let awayWins = 0, awayDraws = 0, awayLosses = 0;

  if (homeGoals > awayGoals) {
    homePoints = 3;
    homeWins = 1;
    awayLosses = 1;
  } else if (homeGoals < awayGoals) {
    awayPoints = 3;
    awayWins = 1;
    homeLosses = 1;
  } else {
    homePoints = 1;
    awayPoints = 1;
    homeDraws = 1;
    awayDraws = 1;
  }

  // Atualizar classificação do time da casa
  await tx.classificacao.upsert({
    where: {
      timeId_campeonatoId: {
        timeId: homeTeamId,
        campeonatoId: championshipId
      }
    },
    update: {
      pontos: { increment: homePoints },
      vitorias: { increment: homeWins },
      empates: { increment: homeDraws },
      derrotas: { increment: homeLosses },
      golsPro: { increment: homeGoals },
      golsContra: { increment: awayGoals },
      jogos: { increment: 1 },
      saldoGols: { increment: homeGoals - awayGoals }
    },
    create: {
      campeonatoId: championshipId,
      timeId: homeTeamId,
      pontos: homePoints,
      vitorias: homeWins,
      empates: homeDraws,
      derrotas: homeLosses,
      golsPro: homeGoals,
      golsContra: awayGoals,
      jogos: 1,
      saldoGols: homeGoals - awayGoals,
      posicao: 1
    }
  });

  // Atualizar classificação do time visitante
  await tx.classificacao.upsert({
    where: {
      timeId_campeonatoId: {
        timeId: awayTeamId,
        campeonatoId: championshipId
      }
    },
    update: {
      pontos: { increment: awayPoints },
      vitorias: { increment: awayWins },
      empates: { increment: awayDraws },
      derrotas: { increment: awayLosses },
      golsPro: { increment: awayGoals },
      golsContra: { increment: homeGoals },
      jogos: { increment: 1 },
      saldoGols: { increment: awayGoals - homeGoals }
    },
    create: {
      campeonatoId: championshipId,
      timeId: awayTeamId,
      pontos: awayPoints,
      vitorias: awayWins,
      empates: awayDraws,
      derrotas: awayLosses,
      golsPro: awayGoals,
      golsContra: homeGoals,
      jogos: 1,
      saldoGols: awayGoals - homeGoals,
      posicao: 1
    }
  });

  // Recalcular posições
  const standings = await tx.classificacao.findMany({
    where: { campeonatoId: championshipId },
    orderBy: [
      { pontos: 'desc' },
      { saldoGols: 'desc' },
      { golsPro: 'desc' },
      { vitorias: 'desc' },
      { golsContra: 'asc' }
    ]
  });

  // Atualizar posições
  for (let i = 0; i < standings.length; i++) {
    await tx.classificacao.update({
      where: { id: standings[i].id },
      data: { posicao: i + 1 }
    });
  }
};

// Atualizar data/hora da partida
const updateMatchDateTime = async (req, res) => {
  try {
    const { id } = req.params;
    const { dataHora } = req.body;
    const userId = req.user.id;

    // Verificar se a partida existe e se o usuário é o organizador do campeonato
    const match = await prisma.partida.findUnique({
      where: { id: parseInt(id) },
      include: {
        campeonato: true
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Partida não encontrada' });
    }

    if (match.campeonato.organizadorId !== userId) {
      return res.status(403).json({ error: 'Apenas o organizador do campeonato pode alterar datas das partidas' });
    }

    const updatedMatch = await prisma.partida.update({
      where: { id: parseInt(id) },
      data: { dataHora: new Date(dataHora) },
      include: {
        timeCasa: {
          select: { id: true, nome: true, escudo: true }
        },
        timeVisitante: {
          select: { id: true, nome: true, escudo: true }
        },
        resultado: true
      }
    });

    res.json({
      message: 'Data da partida atualizada com sucesso',
      match: updatedMatch
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  getMatchesByChampionship,
  getMatchById,
  updateMatchStatus,
  updateMatchResult,
  updateMatchDateTime,
  updateResultValidation
};
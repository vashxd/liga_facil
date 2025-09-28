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

    console.log('Registrando resultado para partida:', id, 'dados:', { golsTimeCasa, golsTimeVisitante, observacoes });

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

    // Versão simplificada sem transação complexa
    try {
      // Criar ou atualizar resultado
      if (match.resultado) {
        await prisma.resultado.update({
          where: { partidaId: match.id },
          data: {
            golsCasa: parseInt(golsTimeCasa),
            golsVisitante: parseInt(golsTimeVisitante)
          }
        });
      } else {
        await prisma.resultado.create({
          data: {
            partidaId: match.id,
            golsCasa: parseInt(golsTimeCasa),
            golsVisitante: parseInt(golsTimeVisitante)
          }
        });
      }

      // Atualizar status da partida para finalizada
      await prisma.partida.update({
        where: { id: match.id },
        data: { status: 'FINALIZADA' }
      });

      console.log('Resultado registrado com sucesso para partida:', id);
    } catch (dbError) {
      console.error('Erro na operação do banco:', dbError);
      return res.status(500).json({ error: 'Erro ao salvar no banco de dados: ' + dbError.message });
    }

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
    console.error('Erro geral:', error);
    res.status(500).json({ error: 'Erro interno do servidor: ' + error.message });
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

// Função para verificar e gerar próxima fase do torneio
const checkAndGenerateNextPhase = async (tx, match, homeGoals, awayGoals) => {
  const championship = match.campeonato;
  const currentPhase = match.fase;

  // Formatos eliminatórios que precisam de geração de próximas fases
  const eliminationFormats = [
    'ELIMINACAO_SIMPLES',
    'MATA_MATA',
    'COPA',
    'ELIMINACAO_DUPLA',
    'SUICO_ELIMINATORIO'
  ];

  if (!eliminationFormats.includes(championship.formato)) {
    return; // Não é um formato que precisa de próximas fases
  }

  // Determinar vencedor
  let winnerId, loserId;
  if (homeGoals > awayGoals) {
    winnerId = match.timeCasaId;
    loserId = match.timeVisitanteId;
  } else if (awayGoals > homeGoals) {
    winnerId = match.timeVisitanteId;
    loserId = match.timeCasaId;
  } else {
    // Empate - implementar critério de desempate (penaltis, etc.)
    // Por enquanto, vamos considerar que o time da casa avança
    winnerId = match.timeCasaId;
    loserId = match.timeVisitanteId;
  }

  // Verificar se todas as partidas da fase atual foram finalizadas
  const phaseMatches = await tx.partida.findMany({
    where: {
      campeonatoId: match.campeonatoId,
      fase: currentPhase
    }
  });

  const finishedMatches = phaseMatches.filter(m => m.status === 'FINALIZADA' || m.id === match.id);
  const allPhaseMatchesFinished = finishedMatches.length === phaseMatches.length;

  if (!allPhaseMatchesFinished) {
    return; // Ainda há partidas pendentes nesta fase
  }

  // Coletar todos os vencedores da fase atual
  const winners = [];

  for (const phaseMatch of phaseMatches) {
    let phaseWinnerId;

    if (phaseMatch.id === match.id) {
      phaseWinnerId = winnerId;
    } else {
      const result = await tx.resultado.findUnique({
        where: { partidaId: phaseMatch.id }
      });

      if (result) {
        if (result.golsTimeCasa > result.golsTimeVisitante) {
          phaseWinnerId = phaseMatch.timeCasaId;
        } else if (result.golsTimeVisitante > result.golsTimeCasa) {
          phaseWinnerId = phaseMatch.timeVisitanteId;
        } else {
          // Empate - time da casa avança (critério simplificado)
          phaseWinnerId = phaseMatch.timeCasaId;
        }
      }
    }

    if (phaseWinnerId) {
      winners.push(phaseWinnerId);
    }
  }

  // Se só sobrou 1 vencedor, o torneio terminou
  if (winners.length === 1) {
    await tx.campeonato.update({
      where: { id: match.campeonatoId },
      data: {
        status: 'FINALIZADO',
        campeaoId: winners[0]
      }
    });
    return;
  }

  // Gerar próxima fase
  await generateNextPhase(tx, championship, winners, currentPhase);
};

// Função para gerar partidas da próxima fase
const generateNextPhase = async (tx, championship, winners, currentPhase) => {
  const nextPhase = getNextPhaseName(currentPhase, winners.length);

  if (!nextPhase) {
    return; // Não há próxima fase
  }

  // Embaralhar vencedores para evitar confrontos previsíveis
  const shuffledWinners = [...winners].sort(() => Math.random() - 0.5);

  // Gerar partidas da próxima fase
  const nextPhaseMatches = [];
  for (let i = 0; i < shuffledWinners.length; i += 2) {
    if (i + 1 < shuffledWinners.length) {
      nextPhaseMatches.push({
        campeonatoId: championship.id,
        timeCasaId: shuffledWinners[i],
        timeVisitanteId: shuffledWinners[i + 1],
        fase: nextPhase,
        dataHora: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 1 semana a partir de agora
        status: 'AGENDADA'
      });
    }
  }

  // Criar as partidas da próxima fase
  if (nextPhaseMatches.length > 0) {
    await tx.partida.createMany({
      data: nextPhaseMatches
    });
  }
};

// Função auxiliar para determinar o nome da próxima fase
const getNextPhaseName = (currentPhase, winnersCount) => {
  const phaseMap = {
    'OITAVAS': 'QUARTAS',
    'QUARTAS': 'SEMI',
    'SEMIFINAL': 'FINAL',
    'SEMI': 'FINAL',
    'FINAL': null // Não há próxima fase após a final
  };

  // Se não está no mapa, determinar pela quantidade de times
  if (!phaseMap[currentPhase]) {
    if (winnersCount >= 16) return 'OITAVAS';
    if (winnersCount >= 8) return 'QUARTAS';
    if (winnersCount >= 4) return 'SEMI';
    if (winnersCount >= 2) return 'FINAL';
    return null;
  }

  return phaseMap[currentPhase];
};

module.exports = {
  getMatchesByChampionship,
  getMatchById,
  updateMatchStatus,
  updateMatchResult,
  updateMatchDateTime,
  updateResultValidation
};
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

    // Verificar se o campeonato está finalizado
    if (match.campeonato.status === 'FINALIZADO') {
      return res.status(400).json({ error: 'Não é possível alterar partidas de campeonatos finalizados' });
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

    // Verificar se o campeonato está finalizado
    if (match.campeonato.status === 'FINALIZADO') {
      return res.status(400).json({ error: 'Não é possível alterar resultados de campeonatos finalizados' });
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

      // Atualizar classificações se for pontos corridos ou grupos + eliminação (durante fase de grupos)
      if (match.campeonato.formato === 'PONTOS_CORRIDOS' ||
          (match.campeonato.formato === 'GRUPOS_ELIMINACAO' && match.fase.startsWith('GRUPO'))) {
        try {
          await updateStandings(match.campeonatoId, match.timeCasaId, match.timeVisitanteId, parseInt(golsTimeCasa), parseInt(golsTimeVisitante), match.fase);
        } catch (error) {
          console.error('Erro ao atualizar classificações:', error);
        }
      }

      // Verificar se deve gerar próxima fase para formatos eliminatórios
      try {
        await checkAndGenerateNextPhase(match, parseInt(golsTimeCasa), parseInt(golsTimeVisitante));
      } catch (error) {
        console.error('Erro ao verificar próxima fase:', error);
        // Não falhar a operação principal por causa disso
      }

      // Verificar se todas as partidas do campeonato terminaram e finalizar se necessário
      try {
        await checkAndFinishChampionship(match.campeonatoId);
      } catch (error) {
        console.error('Erro ao verificar finalização do campeonato:', error);
        // Não falhar a operação principal por causa disso
      }
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

// Função simplificada para atualizar classificações (sem transação)
const updateStandings = async (championshipId, homeTeamId, awayTeamId, homeGoals, awayGoals, phase = null) => {
  console.log('Atualizando classificações:', { championshipId, homeTeamId, awayTeamId, homeGoals, awayGoals, phase });

  // Detectar grupo da fase (se for formato de grupos)
  let grupo = null;
  if (phase && phase.startsWith('GRUPO_')) {
    grupo = phase; // "GRUPO_A", "GRUPO_B", etc.
  }

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

  console.log('Pontos calculados:', { homePoints, awayPoints });

  // Atualizar classificação do time da casa
  await prisma.classificacao.upsert({
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
      posicao: 1,
      grupo: grupo
    }
  });

  // Atualizar classificação do time visitante
  await prisma.classificacao.upsert({
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
      posicao: 1,
      grupo: grupo
    }
  });

  // Recalcular posições
  const standings = await prisma.classificacao.findMany({
    where: { campeonatoId: championshipId },
    orderBy: [
      { pontos: 'desc' },
      { saldoGols: 'desc' },
      { golsPro: 'desc' },
      { vitorias: 'desc' },
      { golsContra: 'asc' }
    ]
  });

  console.log('Recalculando posições para', standings.length, 'times');

  // Atualizar posições
  for (let i = 0; i < standings.length; i++) {
    await prisma.classificacao.update({
      where: { id: standings[i].id },
      data: { posicao: i + 1 }
    });
  }

  console.log('Classificações atualizadas com sucesso');
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

    // Verificar se o campeonato está finalizado
    if (match.campeonato.status === 'FINALIZADO') {
      return res.status(400).json({ error: 'Não é possível alterar datas de partidas em campeonatos finalizados' });
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


// Função simplificada para verificar e gerar próxima fase do torneio
const checkAndGenerateNextPhase = async (match, homeGoals, awayGoals) => {
  const championship = match.campeonato;
  const currentPhase = match.fase;

  console.log('Verificando próxima fase para:', championship.formato, 'fase atual:', currentPhase);

  // Formatos eliminatórios que precisam de geração de próximas fases
  const eliminationFormats = [
    'ELIMINACAO_SIMPLES',
    'MATA_MATA',
    'COPA',
    'ELIMINACAO_DUPLA',
    'SUICO_ELIMINATORIO',
    'GRUPOS_ELIMINACAO'
  ];

  if (!eliminationFormats.includes(championship.formato)) {
    console.log('Formato não é eliminatório, não precisa gerar próximas fases');
    return; // Não é um formato que precisa de próximas fases
  }

  // Determinar vencedor
  let winnerId;
  if (homeGoals > awayGoals) {
    winnerId = match.timeCasaId;
  } else if (awayGoals > homeGoals) {
    winnerId = match.timeVisitanteId;
  } else {
    // Empate - time da casa avança (critério simplificado)
    winnerId = match.timeCasaId;
  }

  console.log('Vencedor da partida:', winnerId);

  // Verificar se todas as partidas da fase atual foram finalizadas
  const phaseMatches = await prisma.partida.findMany({
    where: {
      campeonatoId: match.campeonatoId,
      fase: currentPhase
    }
  });

  const finishedMatches = phaseMatches.filter(m => m.status === 'FINALIZADA');
  const allPhaseMatchesFinished = finishedMatches.length === phaseMatches.length;

  console.log(`Fase ${currentPhase}: ${finishedMatches.length}/${phaseMatches.length} partidas finalizadas`);

  if (!allPhaseMatchesFinished) {
    console.log('Ainda há partidas pendentes nesta fase');
    return; // Ainda há partidas pendentes nesta fase
  }

  console.log('Todas as partidas da fase foram finalizadas, coletando vencedores...');

  // Tratamento especial para formato GRUPOS_ELIMINACAO
  if (championship.formato === 'GRUPOS_ELIMINACAO' && currentPhase.startsWith('GRUPO')) {
    console.log('Verificando se todas as fases de grupos terminaram...');

    // Verificar se TODAS as partidas de TODOS os grupos terminaram
    const allGroupMatches = await prisma.partida.findMany({
      where: {
        campeonatoId: match.campeonatoId,
        fase: { startsWith: 'GRUPO' }
      }
    });

    const allGroupFinishedMatches = allGroupMatches.filter(m => m.status === 'FINALIZADA');

    console.log(`Grupos: ${allGroupFinishedMatches.length}/${allGroupMatches.length} partidas finalizadas`);

    if (allGroupFinishedMatches.length === allGroupMatches.length) {
      console.log('Todas as partidas de grupos terminaram! Classificando times para eliminatórias...');
      await processGroupsToEliminationPhase(match.campeonatoId);
    } else {
      console.log('Ainda há partidas de outros grupos pendentes');
    }
    return;
  }

  // Coletar todos os vencedores da fase atual
  const winners = [];

  for (const phaseMatch of phaseMatches) {
    let phaseWinnerId;

    if (phaseMatch.id === match.id) {
      phaseWinnerId = winnerId;
    } else {
      const result = await prisma.resultado.findUnique({
        where: { partidaId: phaseMatch.id }
      });

      if (result) {
        if (result.golsCasa > result.golsVisitante) {
          phaseWinnerId = phaseMatch.timeCasaId;
        } else if (result.golsVisitante > result.golsCasa) {
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

  console.log('Vencedores da fase:', winners);

  // Se só sobrou 1 vencedor, o torneio terminou
  if (winners.length === 1) {
    console.log('Torneio finalizado! Campeão:', winners[0]);
    await prisma.campeonato.update({
      where: { id: match.campeonatoId },
      data: {
        status: 'FINALIZADO',
        campeaoId: winners[0]
      }
    });
    return;
  }

  // Gerar próxima fase
  await generateNextPhase(championship, winners, currentPhase);
};

// Função para gerar partidas da próxima fase
const generateNextPhase = async (championship, winners, currentPhase) => {
  const nextPhase = getNextPhaseName(currentPhase, winners.length);

  console.log('Gerando próxima fase:', nextPhase, 'com', winners.length, 'times');

  if (!nextPhase) {
    console.log('Não há próxima fase para gerar');
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
        local: 'A definir',
        status: 'AGENDADA'
      });
    }
  }

  // Criar as partidas da próxima fase
  if (nextPhaseMatches.length > 0) {
    console.log('Criando', nextPhaseMatches.length, 'partidas para a próxima fase');
    await prisma.partida.createMany({
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

// Função para processar manualmente a próxima fase de um campeonato
const processNextPhase = async (req, res) => {
  try {
    const { championshipId } = req.params;
    const userId = req.user.id;

    console.log('Processando próxima fase manualmente para campeonato:', championshipId);

    // Verificar se o usuário é organizador do campeonato
    const championship = await prisma.campeonato.findFirst({
      where: {
        id: parseInt(championshipId),
        organizadorId: userId
      }
    });

    if (!championship) {
      return res.status(403).json({ error: 'Você não tem permissão para processar este campeonato' });
    }

    // Buscar todas as partidas finalizadas do campeonato
    const finishedMatches = await prisma.partida.findMany({
      where: {
        campeonatoId: parseInt(championshipId),
        status: 'FINALIZADA'
      },
      include: {
        campeonato: true,
        resultado: true
      },
      orderBy: {
        fase: 'desc' // Pegar a fase mais recente primeiro
      }
    });

    if (finishedMatches.length === 0) {
      return res.status(400).json({ error: 'Nenhuma partida finalizada encontrada' });
    }

    // Pegar a última partida finalizada para processar
    const lastMatch = finishedMatches[0];
    const result = lastMatch.resultado;

    if (!result) {
      return res.status(400).json({ error: 'Partida não possui resultado registrado' });
    }

    // Processar próxima fase baseado na última partida
    await checkAndGenerateNextPhase(lastMatch, result.golsCasa, result.golsVisitante);

    res.json({
      message: 'Próxima fase processada com sucesso',
      championship: championship.nome,
      lastPhase: lastMatch.fase
    });
  } catch (error) {
    console.error('Erro ao processar próxima fase:', error);
    res.status(500).json({ error: 'Erro interno do servidor: ' + error.message });
  }
};

// Função para processar transição de grupos para eliminatórias
const processGroupsToEliminationPhase = async (championshipId) => {
  console.log('Processando transição de grupos para eliminatórias:', championshipId);

  try {
    // Verificar se todas as partidas dos grupos terminaram
    const groupMatches = await prisma.partida.findMany({
      where: {
        campeonatoId: championshipId,
        fase: { startsWith: 'GRUPO' }
      }
    });

    const finishedGroupMatches = groupMatches.filter(m => m.status === 'FINALIZADA');

    if (finishedGroupMatches.length !== groupMatches.length) {
      console.log('Nem todas as partidas dos grupos terminaram ainda');
      return;
    }

    console.log('Todas as partidas dos grupos terminaram, classificando times...');

    // Buscar classificações dos grupos
    const standings = await prisma.classificacao.findMany({
      where: { campeonatoId: championshipId },
      include: { time: true },
      orderBy: [
        { grupo: 'asc' },
        { pontos: 'desc' },
        { saldoGols: 'desc' },
        { golsFeitos: 'desc' }
      ]
    });

    if (standings.length === 0) {
      console.log('Nenhuma classificação encontrada para os grupos');
      return;
    }

    // Agrupar por grupo e pegar os 2 primeiros de cada grupo
    const groupedStandings = {};
    standings.forEach(standing => {
      if (!groupedStandings[standing.grupo]) {
        groupedStandings[standing.grupo] = [];
      }
      groupedStandings[standing.grupo].push(standing);
    });

    const qualifiedTeams = [];
    Object.keys(groupedStandings).forEach(group => {
      const groupTeams = groupedStandings[group].slice(0, 2); // Pegar os 2 primeiros
      qualifiedTeams.push(...groupTeams.map(standing => standing.timeId));
    });

    console.log('Times classificados para eliminatórias:', qualifiedTeams);

    if (qualifiedTeams.length < 2) {
      console.log('Não há times suficientes classificados para eliminatórias');
      return;
    }

    // Gerar partidas das oitavas de final (ou fase apropriada)
    await generateEliminationMatches(championshipId, qualifiedTeams);

  } catch (error) {
    console.error('Erro ao processar transição para eliminatórias:', error);
  }
};

// Função para gerar partidas da fase eliminatória
const generateEliminationMatches = async (championshipId, qualifiedTeams) => {
  console.log('Gerando partidas eliminatórias para', qualifiedTeams.length, 'times');

  // Embaralhar times para evitar confrontos previsíveis
  const shuffledTeams = [...qualifiedTeams].sort(() => Math.random() - 0.5);

  // Determinar qual fase gerar baseado no número de times
  let phaseName;
  if (shuffledTeams.length >= 16) phaseName = 'OITAVAS';
  else if (shuffledTeams.length >= 8) phaseName = 'QUARTAS';
  else if (shuffledTeams.length >= 4) phaseName = 'SEMI';
  else if (shuffledTeams.length >= 2) phaseName = 'FINAL';
  else {
    console.log('Não há times suficientes para gerar fase eliminatória');
    return;
  }

  console.log('Gerando fase:', phaseName);

  // Gerar partidas
  const eliminationMatches = [];
  for (let i = 0; i < shuffledTeams.length; i += 2) {
    if (i + 1 < shuffledTeams.length) {
      eliminationMatches.push({
        campeonatoId: championshipId,
        timeCasaId: shuffledTeams[i],
        timeVisitanteId: shuffledTeams[i + 1],
        fase: phaseName,
        dataHora: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 1 semana a partir de agora
        local: 'A definir',
        status: 'AGENDADA'
      });
    }
  }

  if (eliminationMatches.length > 0) {
    console.log('Criando', eliminationMatches.length, 'partidas da fase', phaseName);
    await prisma.partida.createMany({
      data: eliminationMatches
    });
    console.log('Partidas eliminatórias criadas com sucesso!');
  }
};

// Função para verificar se todas as partidas do campeonato terminaram e finalizar
const checkAndFinishChampionship = async (championshipId) => {
  console.log('Verificando se campeonato deve ser finalizado:', championshipId);

  // Buscar o campeonato
  const championship = await prisma.campeonato.findUnique({
    where: { id: championshipId }
  });

  if (!championship) {
    console.log('Campeonato não encontrado');
    return;
  }

  // Se já está finalizado, não fazer nada
  if (championship.status === 'FINALIZADO') {
    console.log('Campeonato já está finalizado');
    return;
  }

  // Buscar todas as partidas do campeonato
  const allMatches = await prisma.partida.findMany({
    where: { campeonatoId: championshipId }
  });

  if (allMatches.length === 0) {
    console.log('Nenhuma partida encontrada para o campeonato');
    return;
  }

  // Verificar se todas as partidas estão finalizadas
  const finishedMatches = allMatches.filter(match => match.status === 'FINALIZADA');
  const allMatchesFinished = finishedMatches.length === allMatches.length;

  console.log(`Campeonato ${championshipId}: ${finishedMatches.length}/${allMatches.length} partidas finalizadas`);

  if (allMatchesFinished) {
    console.log('Todas as partidas finalizadas! Marcando campeonato como FINALIZADO');

    // Atualizar status do campeonato para FINALIZADO
    await prisma.campeonato.update({
      where: { id: championshipId },
      data: { status: 'FINALIZADO' }
    });

    console.log('Campeonato finalizado automaticamente:', championshipId);
  } else {
    console.log('Ainda há partidas pendentes, campeonato continua ativo');
  }
};

module.exports = {
  getMatchesByChampionship,
  getMatchById,
  updateMatchStatus,
  updateMatchResult,
  updateMatchDateTime,
  updateResultValidation,
  processNextPhase
};
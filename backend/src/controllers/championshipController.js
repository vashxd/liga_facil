const { body, validationResult } = require('express-validator');
const { prisma } = require('../utils/prisma');

// Validações
const createChampionshipValidation = [
  body('nome').notEmpty().withMessage('Nome do campeonato é obrigatório'),
  body('formato').notEmpty().withMessage('Formato é obrigatório'),
  body('dataInicio').isISO8601().withMessage('Data de início deve ser válida')
];

// Criar campeonato
const createChampionship = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nome, formato, dataInicio, privado = false } = req.body;
    const userId = req.user.id;

    const championship = await prisma.campeonato.create({
      data: {
        nome,
        formato,
        dataInicio: new Date(dataInicio),
        privado,
        organizadorId: userId,
        ...(privado && { codigo: generateChampionshipCode() })
      },
      include: {
        organizador: {
          select: { id: true, nome: true, email: true }
        },
        _count: {
          select: { inscricoes: true }
        }
      }
    });

    res.status(201).json({
      message: 'Campeonato criado com sucesso',
      championship,
      ...(championship.privado && championship.codigo && {
        codigo: championship.codigo,
        message: `Campeonato criado com sucesso! Código de acesso: ${championship.codigo}`
      })
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Listar campeonatos públicos
const getPublicChampionships = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      formato,
      search,
      dataInicio,
      dataFim,
      status = 'all',
      organizador
    } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      privado: false,
      ...(formato && { formato }),
      ...(search && {
        nome: {
          contains: search,
          mode: 'insensitive'
        }
      }),
      ...(organizador && {
        organizador: {
          nome: {
            contains: organizador,
            mode: 'insensitive'
          }
        }
      }),
      ...(dataInicio && {
        dataInicio: {
          gte: new Date(dataInicio)
        }
      }),
      ...(dataFim && {
        dataInicio: {
          lte: new Date(dataFim)
        }
      })
    };

    // Filtro por status baseado na data atual
    const now = new Date();
    if (status === 'upcoming') {
      where.dataInicio = { gte: now };
    } else if (status === 'ongoing') {
      where.dataInicio = { lte: now };
      // Adicionar lógica para verificar se ainda está em andamento
    } else if (status === 'finished') {
      // Adicionar lógica para campeonatos finalizados
    }

    const [championships, total] = await Promise.all([
      prisma.campeonato.findMany({
        where,
        include: {
          organizador: {
            select: { id: true, nome: true }
          },
          _count: {
            select: { inscricoes: true, partidas: true }
          }
        },
        orderBy: { dataInicio: 'asc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.campeonato.count({ where })
    ]);

    // Calcular status dinamicamente
    const championshipsWithStatus = championships.map(championship => {
      let currentStatus = 'upcoming';
      if (championship.dataInicio <= now) {
        currentStatus = championship._count.partidas > 0 ? 'ongoing' : 'upcoming';
        // Verificar se todas as partidas foram finalizadas
        // Esta lógica pode ser refinada baseada no status das partidas
      }

      return {
        ...championship,
        status: currentStatus,
        hasAvailableSlots: championship._count.inscricoes < 32 // Assumindo limite de 32 times
      };
    });

    res.json({
      championships: championshipsWithStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        formatos: await getAvailableFormats(),
        statusOptions: ['all', 'upcoming', 'ongoing', 'finished']
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Função auxiliar para obter formatos disponíveis
const getAvailableFormats = async () => {
  try {
    const formats = await prisma.campeonato.findMany({
      where: { privado: false },
      select: { formato: true },
      distinct: ['formato']
    });

    return formats.map(f => f.formato);
  } catch (error) {
    console.error(error);
    return [];
  }
};

// Listar campeonatos do usuário
const getUserChampionships = async (req, res) => {
  try {
    const userId = req.user.id;

    const championships = await prisma.campeonato.findMany({
      where: { organizadorId: userId },
      include: {
        _count: {
          select: { inscricoes: true, partidas: true }
        }
      },
      orderBy: { dataInicio: 'desc' }
    });

    res.json({ championships });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter detalhes de um campeonato
const getChampionshipById = async (req, res) => {
  try {
    const { id } = req.params;

    const championship = await prisma.campeonato.findUnique({
      where: { id: parseInt(id) },
      include: {
        organizador: {
          select: { id: true, nome: true, email: true }
        },
        inscricoes: {
          include: {
            time: {
              include: {
                jogadores: true
              }
            }
          }
        },
        partidas: {
          include: {
            timeCasa: true,
            timeVisitante: true,
            resultado: true
          },
          orderBy: { dataHora: 'asc' }
        },
        classificacoes: {
          include: {
            time: true
          },
          orderBy: { posicao: 'asc' }
        }
      }
    });

    if (!championship) {
      return res.status(404).json({ error: 'Campeonato não encontrado' });
    }

    // Include codigo only for the organizer if it's a private championship
    const responseChampionship = { ...championship };
    if (championship.privado && req.user?.id === championship.organizadorId) {
      // Keep the codigo field visible for the organizer
    } else {
      // Remove codigo field for non-organizers
      delete responseChampionship.codigo;
    }

    res.json({ championship: responseChampionship });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Inscrever time em campeonato
const enrollTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { timeId } = req.body;
    const userId = req.user.id;

    // Verificar se o campeonato existe
    const championship = await prisma.campeonato.findUnique({
      where: { id: parseInt(id) }
    });

    if (!championship) {
      return res.status(404).json({ error: 'Campeonato não encontrado' });
    }

    // Verificar se o time pertence ao usuário
    const team = await prisma.time.findFirst({
      where: {
        id: parseInt(timeId),
        criadorId: userId
      }
    });

    if (!team) {
      return res.status(404).json({ error: 'Time não encontrado' });
    }

    // Verificar se já está inscrito
    const existingEnrollment = await prisma.inscricao.findFirst({
      where: {
        campeonatoId: parseInt(id),
        timeId: parseInt(timeId)
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({ error: 'Time já está inscrito neste campeonato' });
    }

    const enrollment = await prisma.inscricao.create({
      data: {
        campeonatoId: parseInt(id),
        timeId: parseInt(timeId),
        status: 'CONFIRMADO'
      },
      include: {
        time: true,
        campeonato: {
          select: { nome: true }
        }
      }
    });

    res.status(201).json({
      message: 'Time inscrito com sucesso',
      enrollment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar campeonato
const updateChampionship = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, formato, dataInicio, privado } = req.body;
    const userId = req.user.id;

    // Verificar se o campeonato pertence ao usuário
    const existingChampionship = await prisma.campeonato.findFirst({
      where: {
        id: parseInt(id),
        organizadorId: userId
      }
    });

    if (!existingChampionship) {
      return res.status(404).json({ error: 'Campeonato não encontrado' });
    }

    const updatedChampionship = await prisma.campeonato.update({
      where: { id: parseInt(id) },
      data: {
        ...(nome && { nome }),
        ...(formato && { formato }),
        ...(dataInicio && { dataInicio: new Date(dataInicio) }),
        ...(privado !== undefined && { privado })
      },
      include: {
        organizador: {
          select: { id: true, nome: true, email: true }
        },
        _count: {
          select: { inscricoes: true }
        }
      }
    });

    res.json({
      message: 'Campeonato atualizado com sucesso',
      championship: updatedChampionship
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Função auxiliar para embaralhar array
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Gerar chaves do campeonato (sorteio)
const generateMatches = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar se o campeonato pertence ao usuário
    const championship = await prisma.campeonato.findFirst({
      where: {
        id: parseInt(id),
        organizadorId: userId
      },
      include: {
        inscricoes: {
          include: {
            time: true
          }
        },
        partidas: true
      }
    });

    if (!championship) {
      return res.status(404).json({ error: 'Campeonato não encontrado' });
    }

    if (championship.partidas.length > 0) {
      return res.status(400).json({ error: 'Campeonato já possui partidas geradas' });
    }

    const teams = championship.inscricoes.map(inscricao => inscricao.time);

    if (teams.length < 2) {
      return res.status(400).json({ error: 'É necessário pelo menos 2 times inscritos para gerar as partidas' });
    }

    // Embaralhar times para o sorteio
    const shuffledTeams = shuffleArray(teams);
    const matches = [];

    // Gerar partidas baseado no formato
    switch (championship.formato) {
      case 'ELIMINACAO_SIMPLES':
        // Para eliminação simples, gerar primeira fase
        for (let i = 0; i < shuffledTeams.length; i += 2) {
          if (i + 1 < shuffledTeams.length) {
            matches.push({
              campeonatoId: championship.id,
              timeCasaId: shuffledTeams[i].id,
              timeVisitanteId: shuffledTeams[i + 1].id,
              fase: 'PRIMEIRA_FASE',
              dataHora: new Date(championship.dataInicio),
              local: 'A definir',
              status: 'AGENDADA'
            });
          }
        }
        break;

      case 'PONTOS_CORRIDOS':
        // Para pontos corridos, todos contra todos
        for (let i = 0; i < shuffledTeams.length; i++) {
          for (let j = i + 1; j < shuffledTeams.length; j++) {
            matches.push({
              campeonatoId: championship.id,
              timeCasaId: shuffledTeams[i].id,
              timeVisitanteId: shuffledTeams[j].id,
              fase: 'FASE_UNICA',
              dataHora: new Date(championship.dataInicio),
              local: 'A definir',
              status: 'AGENDADA'
            });
          }
        }
        break;

      case 'GRUPOS_ELIMINACAO':
        // Dividir em grupos de 4 times
        const groupSize = 4;
        const numGroups = Math.ceil(shuffledTeams.length / groupSize);

        for (let g = 0; g < numGroups; g++) {
          const groupTeams = shuffledTeams.slice(g * groupSize, (g + 1) * groupSize);

          // Gerar partidas dentro do grupo
          for (let i = 0; i < groupTeams.length; i++) {
            for (let j = i + 1; j < groupTeams.length; j++) {
              matches.push({
                campeonatoId: championship.id,
                timeCasaId: groupTeams[i].id,
                timeVisitanteId: groupTeams[j].id,
                fase: `GRUPO_${String.fromCharCode(65 + g)}`, // GRUPO_A, GRUPO_B, etc.
                dataHora: new Date(championship.dataInicio),
                local: 'A definir',
                status: 'AGENDADA'
              });
            }
          }
        }
        break;

      default:
        // Para outros formatos, usar eliminação simples como padrão
        for (let i = 0; i < shuffledTeams.length; i += 2) {
          if (i + 1 < shuffledTeams.length) {
            matches.push({
              campeonatoId: championship.id,
              timeCasaId: shuffledTeams[i].id,
              timeVisitanteId: shuffledTeams[i + 1].id,
              fase: 'PRIMEIRA_FASE',
              dataHora: new Date(championship.dataInicio),
              local: 'A definir',
              status: 'AGENDADA'
            });
          }
        }
    }

    // Salvar todas as partidas no banco
    await prisma.partida.createMany({
      data: matches
    });

    // Buscar as partidas criadas com os dados dos times
    const createdMatches = await prisma.partida.findMany({
      where: { campeonatoId: championship.id },
      include: {
        timeCasa: true,
        timeVisitante: true
      },
      orderBy: { fase: 'asc' }
    });

    res.json({
      message: 'Chaves do campeonato geradas com sucesso',
      matches: createdMatches,
      totalMatches: createdMatches.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter classificação do campeonato
const getChampionshipStandings = async (req, res) => {
  try {
    const { id } = req.params;

    const standings = await prisma.classificacao.findMany({
      where: { campeonatoId: parseInt(id) },
      include: {
        time: {
          select: { id: true, nome: true, escudo: true }
        }
      },
      orderBy: [
        { pontos: 'desc' },
        { vitorias: 'desc' },
        { golsPro: 'desc' },
        { golsContra: 'asc' }
      ]
    });

    // Calcular saldo de gols para cada time
    const standingsWithBalance = standings.map(standing => ({
      ...standing,
      saldoGols: standing.golsPro - standing.golsContra,
      jogos: standing.vitorias + standing.empates + standing.derrotas
    }));

    res.json({ standings: standingsWithBalance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar campeonato por código privado
const getChampionshipByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const championship = await prisma.campeonato.findFirst({
      where: {
        privado: true,
        codigo: code.toUpperCase()
      },
      include: {
        organizador: {
          select: { id: true, nome: true }
        },
        _count: {
          select: { inscricoes: true, partidas: true }
        }
      }
    });

    if (!championship) {
      return res.status(404).json({ error: 'Campeonato não encontrado ou código inválido' });
    }

    // Verificar se o usuário já está inscrito
    const userId = req.user?.id;
    let userEnrolled = false;

    if (userId) {
      const existingEnrollment = await prisma.inscricao.findFirst({
        where: {
          campeonatoId: championship.id,
          time: {
            criadorId: userId
          }
        }
      });
      userEnrolled = !!existingEnrollment;
    }

    res.json({
      championship: {
        ...championship,
        userEnrolled,
        hasAvailableSlots: championship._count.inscricoes < 32
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Gerar código para campeonato privado
const generateChampionshipCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Deletar campeonato
const deleteChampionship = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar se o campeonato pertence ao usuário
    const championship = await prisma.campeonato.findFirst({
      where: {
        id: parseInt(id),
        organizadorId: userId
      },
      include: {
        partidas: true,
        inscricoes: true
      }
    });

    if (!championship) {
      return res.status(404).json({ error: 'Campeonato não encontrado' });
    }

    // Verificar se já tem partidas jogadas
    const hasPlayedMatches = championship.partidas.some(partida => partida.status === 'FINALIZADA');
    if (hasPlayedMatches) {
      return res.status(400).json({ error: 'Não é possível deletar campeonato com partidas já finalizadas' });
    }

    // Deletar em cascata: primeiro partidas, depois inscrições, depois campeonato
    await prisma.$transaction(async (prisma) => {
      // Deletar partidas
      await prisma.partida.deleteMany({
        where: { campeonatoId: parseInt(id) }
      });

      // Deletar inscrições
      await prisma.inscricao.deleteMany({
        where: { campeonatoId: parseInt(id) }
      });

      // Deletar campeonato
      await prisma.campeonato.delete({
        where: { id: parseInt(id) }
      });
    });

    res.json({ message: 'Campeonato deletado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Listar inscrições do campeonato
const getChampionshipEnrollments = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar se o campeonato pertence ao usuário
    const championship = await prisma.campeonato.findFirst({
      where: {
        id: parseInt(id),
        organizadorId: userId
      }
    });

    if (!championship) {
      return res.status(404).json({ error: 'Campeonato não encontrado' });
    }

    const enrollments = await prisma.inscricao.findMany({
      where: {
        campeonatoId: parseInt(id)
      },
      include: {
        time: {
          include: {
            criador: {
              select: { id: true, nome: true, email: true }
            },
            _count: {
              select: { jogadores: true }
            }
          }
        }
      },
      orderBy: {
        dataInscricao: 'asc'
      }
    });

    res.json({ enrollments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Remover time do campeonato
const removeTeamFromChampionship = async (req, res) => {
  try {
    const { id, teamId } = req.params;
    const userId = req.user.id;

    // Verificar se o campeonato pertence ao usuário
    const championship = await prisma.campeonato.findFirst({
      where: {
        id: parseInt(id),
        organizadorId: userId
      },
      include: {
        partidas: true
      }
    });

    if (!championship) {
      return res.status(404).json({ error: 'Campeonato não encontrado' });
    }

    // Verificar se já foram geradas partidas
    if (championship.partidas.length > 0) {
      return res.status(400).json({ error: 'Não é possível remover times após as chaves terem sido geradas' });
    }

    // Verificar se o time está inscrito
    const enrollment = await prisma.inscricao.findFirst({
      where: {
        campeonatoId: parseInt(id),
        timeId: parseInt(teamId)
      }
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Time não está inscrito neste campeonato' });
    }

    // Remover inscrição
    await prisma.inscricao.delete({
      where: {
        id: enrollment.id
      }
    });

    res.json({ message: 'Time removido do campeonato com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  createChampionship,
  getPublicChampionships,
  getUserChampionships,
  getChampionshipById,
  getChampionshipByCode,
  enrollTeam,
  updateChampionship,
  generateMatches,
  getChampionshipStandings,
  deleteChampionship,
  getChampionshipEnrollments,
  removeTeamFromChampionship,
  createChampionshipValidation,
  generateChampionshipCode
};
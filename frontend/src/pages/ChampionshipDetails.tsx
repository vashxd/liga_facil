import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Badge,
  CircularProgress,
  Alert,
  Divider,
  Fade,
  Grow,
  useTheme,
  alpha
} from '@mui/material';
import {
  EmojiEvents,
  ArrowBack,
  Sports,
  Schedule,
  People,
  EditNote,
  Close,
  CalendarToday,
  LocationOn,
  Visibility
} from '@mui/icons-material';
import { championshipService, matchService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Championship {
  id: number;
  nome: string;
  formato: string;
  dataInicio: string;
  privado: boolean;
  organizador: {
    id: number;
    nome: string;
    email: string;
  };
  inscricoes: Array<{
    id: number;
    time: {
      id: number;
      nome: string;
      escudo?: string;
    };
  }>;
  partidas: Array<{
    id: number;
    fase: string;
    dataHora: string;
    status: string;
    timeCasa: {
      id: number;
      nome: string;
      escudo?: string;
    };
    timeVisitante: {
      id: number;
      nome: string;
      escudo?: string;
    };
    resultado?: {
      golsTimeCasa: number;
      golsTimeVisitante: number;
    };
  }>;
  classificacoes: Array<{
    id: number;
    posicao: number;
    pontos: number;
    vitorias: number;
    empates: number;
    derrotas: number;
    golsPro: number;
    golsContra: number;
    time: {
      id: number;
      nome: string;
      escudo?: string;
    };
  }>;
}

const ChampionshipDetails: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'matches' | 'standings'>('info');
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [resultForm, setResultForm] = useState({
    golsTimeCasa: '',
    golsTimeVisitante: '',
    observacoes: ''
  });
  const [standings, setStandings] = useState<any[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadChampionship();
    }
  }, [id]);

  useEffect(() => {
    if (activeTab === 'standings' && championship) {
      loadStandings();
    }
  }, [activeTab, championship]);

  const loadChampionship = async () => {
    try {
      const response = await championshipService.getChampionshipById(parseInt(id!));
      setChampionship(response.championship);
    } catch (error: any) {
      setError('Erro ao carregar detalhes do campeonato');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadStandings = async () => {
    setStandingsLoading(true);
    try {
      const response = await championshipService.getChampionshipStandings(parseInt(id!));
      setStandings(response.standings);
    } catch (error: any) {
      console.error('Erro ao carregar classificações:', error);
    } finally {
      setStandingsLoading(false);
    }
  };

  const handleResultClick = (match: any) => {
    setSelectedMatch(match);
    if (match.resultado) {
      setResultForm({
        golsTimeCasa: match.resultado.golsCasa.toString(),
        golsTimeVisitante: match.resultado.golsVisitante.toString(),
        observacoes: ''
      });
    } else {
      setResultForm({
        golsTimeCasa: '',
        golsTimeVisitante: '',
        observacoes: ''
      });
    }
    setShowResultModal(true);
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;

    try {
      await matchService.updateMatchResult(selectedMatch.id, {
        golsTimeCasa: parseInt(resultForm.golsTimeCasa),
        golsTimeVisitante: parseInt(resultForm.golsTimeVisitante),
        observacoes: resultForm.observacoes
      });

      alert('Resultado registrado com sucesso!');
      setShowResultModal(false);
      setSelectedMatch(null);
      loadChampionship(); // Recarregar dados
      if (activeTab === 'standings') {
        loadStandings(); // Recarregar classificações
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao registrar resultado');
    }
  };

  const isOrganizer = championship && user && championship.organizador.id === user.id;

  const formatChampionshipType = (formato: string) => {
    const formatMap: { [key: string]: string } = {
      'ELIMINACAO_SIMPLES': 'Eliminação Simples',
      'ELIMINACAO_DUPLA': 'Eliminação Dupla',
      'GRUPOS_ELIMINACAO': 'Grupos + Eliminação',
      'PONTOS_CORRIDOS': 'Pontos Corridos',
      'SUICO': 'Sistema Suíço',
      'ROUND_ROBIN': 'Round Robin',
      'MATA_MATA_GRUPOS': 'Mata-mata com Grupos',
      'PLAYOFF': 'Playoff',
      'LIGA_ASCENSO': 'Liga com Ascenso',
      'TORNEIO_DUPLO': 'Torneio Duplo',
      'CLASSIFICATORIO': 'Classificatório',
      'COPA_LIGA': 'Copa Liga',
      'CHAMPIONS': 'Champions',
      'MUNDIAL': 'Mundial',
      'REGIONAL': 'Regional',
      'ESTADUAL': 'Estadual',
      'MUNICIPAL': 'Municipal',
      'AMISTOSO': 'Amistoso',
      'FESTIVAL': 'Festival',
      'EXHIBITION': 'Exhibition'
    };
    return formatMap[formato] || formato;
  };

  const formatMatchStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'AGENDADA': 'Agendada',
      'EM_ANDAMENTO': 'Em Andamento',
      'FINALIZADA': 'Finalizada',
      'CANCELADA': 'Cancelada',
      'ADIADA': 'Adiada'
    };
    return statusMap[status] || status;
  };

  const formatPhase = (fase: string) => {
    const phaseMap: { [key: string]: string } = {
      'PRIMEIRA_FASE': 'Primeira Fase',
      'SEGUNDA_FASE': 'Segunda Fase',
      'OITAVAS': 'Oitavas de Final',
      'QUARTAS': 'Quartas de Final',
      'SEMIFINAL': 'Semifinal',
      'FINAL': 'Final',
      'FASE_UNICA': 'Fase Única',
      'GRUPO_A': 'Grupo A',
      'GRUPO_B': 'Grupo B',
      'GRUPO_C': 'Grupo C',
      'GRUPO_D': 'Grupo D'
    };
    return phaseMap[fase] || fase;
  };

  const theme = useTheme();

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Box textAlign="center">
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Carregando detalhes do campeonato...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error || !championship) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Campeonato não encontrado'}
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/championships')}
        >
          Voltar para Campeonatos
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Moderno */}
      <Fade in timeout={800}>
        <Paper
          elevation={4}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            p: 4,
            mb: 4,
            borderRadius: 3,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 150,
              height: 150,
              background: alpha('#fff', 0.1),
              borderRadius: '50%'
            }}
          />
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <EmojiEvents sx={{ fontSize: 40 }} />
              <Typography variant="h4" fontWeight="bold">
                Detalhes do Campeonato
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/championships')}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              Voltar
            </Button>
          </Box>
        </Paper>
      </Fade>

      {/* Informações do Campeonato */}
      <Grow in timeout={1000}>
        <Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 3 }}>
          <Box mb={3}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <EmojiEvents sx={{ fontSize: 32, color: 'primary.main' }} />
              <Typography variant="h3" fontWeight="bold" color="primary.main">
                {championship.nome}
              </Typography>
            </Box>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip
                label={championship.privado ? 'Privado' : 'Público'}
                color={championship.privado ? 'default' : 'success'}
                variant="filled"
                icon={championship.privado ? <Visibility /> : <People />}
              />
              <Chip
                label={formatChampionshipType(championship.formato)}
                color="primary"
                variant="outlined"
                icon={<Sports />}
              />
            </Box>
          </Box>

          <Box
            display="flex"
            flexDirection={{ xs: 'column', md: 'row' }}
            gap={3}
          >
            <Box flex={1}>
              <Card elevation={1} sx={{ height: '100%', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Schedule color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                      Informações Gerais
                    </Typography>
                  </Box>
                  <Box sx={{ '& > div': { mb: 1 } }}>
                    <Typography variant="body2">
                      <strong>Data de Início:</strong> {new Date(championship.dataInicio).toLocaleDateString('pt-BR')}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Organizador:</strong> {championship.organizador.nome}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Times Inscritos:</strong> {championship.inscricoes.length}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Partidas:</strong> {championship.partidas.length}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box flex={1}>
              <Card elevation={1} sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Sports sx={{ color: 'white' }} />
                    <Typography variant="h6" fontWeight="bold">
                      Estatísticas
                    </Typography>
                  </Box>
                  <Box sx={{ '& > div': { mb: 1 } }}>
                    <Typography variant="body2">
                      <strong>Partidas Finalizadas:</strong> {championship.partidas.filter(p => p.status === 'FINALIZADA').length}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Partidas Agendadas:</strong> {championship.partidas.filter(p => p.status === 'AGENDADA').length}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Formato:</strong> {formatChampionshipType(championship.formato)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Paper>
      </Grow>

      {/* Tabs Modernas */}
      <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{
            bgcolor: 'background.paper',
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none'
            }
          }}
        >
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <People />
                <span>Times Inscritos</span>
                <Chip label={championship.inscricoes.length} size="small" />
              </Box>
            }
            value="info"
          />
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <Sports />
                <span>Partidas</span>
                <Chip label={championship.partidas.length} size="small" />
              </Box>
            }
            value="matches"
          />
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <EmojiEvents />
                <span>Classificação</span>
                <Chip label={championship.classificacoes.length} size="small" />
              </Box>
            }
            value="standings"
          />
        </Tabs>
      </Paper>

      {/* Conteúdo das Tabs */}
      <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
        {activeTab === 'info' && (
          <Fade in timeout={600}>
            <div>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <People color="primary" />
                Times Inscritos
              </Typography>
              {championship.inscricoes.length === 0 ? (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  py={8}
                  textAlign="center"
                >
                  <Sports sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Nenhum time inscrito ainda
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Os times aparecerão aqui quando se inscreverem no campeonato
                  </Typography>
                </Box>
              ) : (
                <Box
                  display="grid"
                  gridTemplateColumns={{
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)'
                  }}
                  gap={3}
                >
                  {championship.inscricoes.map((inscricao, index) => (
                    <Grow in timeout={800 + index * 100} key={inscricao.id}>
                      <Card
                        elevation={3}
                        sx={{
                          height: '100%',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: 6
                          },
                          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        <CardContent sx={{ textAlign: 'center', p: 3 }}>
                          <Avatar
                            sx={{
                              width: 64,
                              height: 64,
                              mx: 'auto',
                              mb: 2,
                              bgcolor: 'primary.main',
                              fontSize: 28
                            }}
                            src={inscricao.time.escudo}
                          >
                            <Sports />
                          </Avatar>
                          <Typography variant="h6" fontWeight="bold" color="primary.main">
                            {inscricao.time.nome}
                          </Typography>
                          <Chip
                            label="Inscrito"
                            color="success"
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </CardContent>
                      </Card>
                    </Grow>
                  ))}
                </Box>
              )}
            </div>
          </Fade>
        )}

        {activeTab === 'matches' && (
          <Fade in timeout={600}>
            <div>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Sports color="primary" />
                Partidas
              </Typography>
              {championship.partidas.length === 0 ? (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  py={8}
                  textAlign="center"
                >
                  <Sports sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Nenhuma partida agendada ainda
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Use o botão "Gerar Chaves" para criar as partidas do campeonato
                  </Typography>
                </Box>
              ) : (
                <Box
                  display="grid"
                  gridTemplateColumns={{
                    xs: '1fr',
                    md: 'repeat(2, 1fr)',
                    lg: 'repeat(3, 1fr)'
                  }}
                  gap={3}
                >
                  {championship.partidas.map((partida, index) => (
                    <Grow in timeout={600 + index * 100} key={partida.id}>
                      <Card
                        elevation={4}
                        sx={{
                          height: '100%',
                          background: partida.status === 'FINALIZADA'
                            ? 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)'
                            : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                          border: '1px solid',
                          borderColor: partida.status === 'FINALIZADA' ? 'success.light' : 'primary.light',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 8
                          }
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          {/* Header da partida */}
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Chip
                              label={formatPhase(partida.fase)}
                              color="primary"
                              variant="outlined"
                              size="small"
                            />
                            <Chip
                              label={formatMatchStatus(partida.status)}
                              color={partida.status === 'FINALIZADA' ? 'success' : 'default'}
                              variant="filled"
                              size="small"
                            />
                          </Box>

                          {/* Times e placar */}
                          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                            {/* Time Casa */}
                            <Box display="flex" alignItems="center" gap={1} flex={1}>
                              <Avatar
                                src={partida.timeCasa.escudo}
                                sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}
                              >
                                <Sports />
                              </Avatar>
                              <Typography variant="body2" fontWeight="bold" noWrap>
                                {partida.timeCasa.nome}
                              </Typography>
                            </Box>

                            {/* Placar */}
                            <Box textAlign="center" mx={2}>
                              {partida.resultado ? (
                                <Typography variant="h5" fontWeight="bold" color="primary.main">
                                  {partida.resultado.golsCasa} × {partida.resultado.golsVisitante}
                                </Typography>
                              ) : (
                                <Typography variant="h6" color="text.secondary">
                                  VS
                                </Typography>
                              )}
                            </Box>

                            {/* Time Visitante */}
                            <Box display="flex" alignItems="center" gap={1} flex={1} justifyContent="flex-end">
                              <Typography variant="body2" fontWeight="bold" noWrap>
                                {partida.timeVisitante.nome}
                              </Typography>
                              <Avatar
                                src={partida.timeVisitante.escudo}
                                sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}
                              >
                                <Sports />
                              </Avatar>
                            </Box>
                          </Box>

                          {/* Data e horário */}
                          <Box display="flex" alignItems="center" gap={1} mb={2} justifyContent="center">
                            <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(partida.dataHora).toLocaleString('pt-BR')}
                            </Typography>
                          </Box>

                          {/* Local */}
                          <Box display="flex" alignItems="center" gap={1} mb={2} justifyContent="center">
                            <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              A definir
                            </Typography>
                          </Box>

                          {/* Botões de ação */}
                          {isOrganizer && (
                            <Box mt={2}>
                              {partida.status === 'AGENDADA' && (
                                <Button
                                  variant="contained"
                                  color="primary"
                                  size="small"
                                  fullWidth
                                  startIcon={<EditNote />}
                                  onClick={() => handleResultClick(partida)}
                                >
                                  Registrar Resultado
                                </Button>
                              )}
                              {partida.status === 'FINALIZADA' && (
                                <Button
                                  variant="outlined"
                                  color="primary"
                                  size="small"
                                  fullWidth
                                  startIcon={<EditNote />}
                                  onClick={() => handleResultClick(partida)}
                                >
                                  Editar Resultado
                                </Button>
                              )}
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grow>
                  ))}
                </Box>
              )}
            </div>
          </Fade>
        )}

        {activeTab === 'standings' && (
          <Fade in timeout={600}>
            <div>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmojiEvents color="primary" />
                Classificação
              </Typography>
              {standingsLoading ? (
                <Box display="flex" justifyContent="center" py={8}>
                  <CircularProgress size={40} />
                </Box>
              ) : standings.length === 0 ? (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  py={8}
                  textAlign="center"
                >
                  <EmojiEvents sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Classificação ainda não disponível
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    As classificações serão geradas conforme os resultados das partidas
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'primary.main' }}>
                        <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', minWidth: 60 }}>
                          Pos
                        </TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 200 }}>
                          Time
                        </TableCell>
                        <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', minWidth: 50 }}>
                          J
                        </TableCell>
                        <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', minWidth: 50 }}>
                          V
                        </TableCell>
                        <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', minWidth: 50 }}>
                          E
                        </TableCell>
                        <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', minWidth: 50 }}>
                          D
                        </TableCell>
                        <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', minWidth: 50 }}>
                          GP
                        </TableCell>
                        <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', minWidth: 50 }}>
                          GC
                        </TableCell>
                        <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', minWidth: 50 }}>
                          SG
                        </TableCell>
                        <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', minWidth: 60 }}>
                          Pts
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {standings.map((standing, index) => (
                        <TableRow
                          key={standing.id}
                          sx={{
                            '&:nth-of-type(odd)': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                            transition: 'background-color 0.2s ease'
                          }}
                        >
                          <TableCell align="center">
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                bgcolor: index < 3 ? `${['#ffd700', '#c0c0c0', '#cd7f32'][index]}` : 'primary.main',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                margin: '0 auto'
                              }}
                            >
                              {standing.posicao}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Avatar
                                src={standing.time.escudo}
                                sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
                              >
                                <Sports sx={{ fontSize: 16 }} />
                              </Avatar>
                              <Typography variant="body2" fontWeight="bold">
                                {standing.time.nome}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">{standing.jogos}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={standing.vitorias}
                              color="success"
                              size="small"
                              variant={standing.vitorias > 0 ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={standing.empates}
                              color="warning"
                              size="small"
                              variant={standing.empates > 0 ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={standing.derrotas}
                              color="error"
                              size="small"
                              variant={standing.derrotas > 0 ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell align="center">{standing.golsPro}</TableCell>
                          <TableCell align="center">{standing.golsContra}</TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              color={standing.saldoGols > 0 ? 'success.main' : standing.saldoGols < 0 ? 'error.main' : 'text.secondary'}
                            >
                              {standing.saldoGols >= 0 ? '+' : ''}{standing.saldoGols}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="h6" fontWeight="bold" color="primary.main">
                              {standing.pontos}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </div>
          </Fade>
        )}
      </Paper>

      {/* Modal de Resultado Moderno */}
      <Dialog
        open={showResultModal && !!selectedMatch}
        onClose={() => {
          setShowResultModal(false);
          setSelectedMatch(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 2
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h5" fontWeight="bold" color="primary.main">
              Resultado da Partida
            </Typography>
            <IconButton
              onClick={() => {
                setShowResultModal(false);
                setSelectedMatch(null);
              }}
              size="small"
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {selectedMatch && (
            <>
              <Box textAlign="center" mb={3}>
                <Typography variant="h6" fontWeight="bold" mb={1}>
                  {selectedMatch.timeCasa.nome} vs {selectedMatch.timeVisitante.nome}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatPhase(selectedMatch.fase)} - {new Date(selectedMatch.dataHora).toLocaleString('pt-BR')}
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Box component="form" onSubmit={handleSubmitResult}>
                {/* Placar */}
                <Box display="flex" alignItems="center" justifyContent="center" gap={3} mb={3}>
                  <Box textAlign="center" flex={1}>
                    <Avatar
                      src={selectedMatch.timeCasa.escudo}
                      sx={{ width: 48, height: 48, mx: 'auto', mb: 1, bgcolor: 'primary.main' }}
                    >
                      <Sports />
                    </Avatar>
                    <Typography variant="body2" fontWeight="bold" mb={1}>
                      {selectedMatch.timeCasa.nome}
                    </Typography>
                    <TextField
                      type="number"
                      inputProps={{ min: 0, style: { textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold' } }}
                      value={resultForm.golsTimeCasa}
                      onChange={(e) => setResultForm({...resultForm, golsTimeCasa: e.target.value})}
                      required
                      sx={{ width: 80 }}
                    />
                  </Box>

                  <Typography variant="h3" fontWeight="bold" color="text.secondary">
                    ×
                  </Typography>

                  <Box textAlign="center" flex={1}>
                    <Avatar
                      src={selectedMatch.timeVisitante.escudo}
                      sx={{ width: 48, height: 48, mx: 'auto', mb: 1, bgcolor: 'primary.main' }}
                    >
                      <Sports />
                    </Avatar>
                    <Typography variant="body2" fontWeight="bold" mb={1}>
                      {selectedMatch.timeVisitante.nome}
                    </Typography>
                    <TextField
                      type="number"
                      inputProps={{ min: 0, style: { textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold' } }}
                      value={resultForm.golsTimeVisitante}
                      onChange={(e) => setResultForm({...resultForm, golsTimeVisitante: e.target.value})}
                      required
                      sx={{ width: 80 }}
                    />
                  </Box>
                </Box>

                {/* Observações */}
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Observações (opcional)"
                  value={resultForm.observacoes}
                  onChange={(e) => setResultForm({...resultForm, observacoes: e.target.value})}
                  placeholder="Adicione observações sobre a partida..."
                  sx={{ mb: 3 }}
                />
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              setShowResultModal(false);
              setSelectedMatch(null);
            }}
            variant="outlined"
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmitResult}
            variant="contained"
            color="primary"
            startIcon={<EditNote />}
          >
            Salvar Resultado
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ChampionshipDetails;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  Avatar,
  Chip,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  Fade,
  Grow,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Collapse
} from '@mui/material';
import {
  EmojiEvents,
  Add,
  Search,
  FilterList,
  Lock,
  ExpandMore,
  Dashboard,
  People,
  Visibility,
  Sports,
  Schedule,
  PlayArrow,
  Settings,
  PersonAdd,
  Close
} from '@mui/icons-material';
import { championshipService, teamService } from '../services/api';

interface Championship {
  id: number;
  nome: string;
  formato: string;
  dataInicio: string;
  privado: boolean;
  organizador?: {
    id: number;
    nome: string;
  };
  _count?: {
    inscricoes: number;
  };
}

interface Team {
  id: number;
  nome: string;
  escudo?: string;
  dataCriacao: string;
  jogadores: any[];
}

const Championships: React.FC = () => {
  const navigate = useNavigate();
  const [userChampionships, setUserChampionships] = useState<Championship[]>([]);
  const [publicChampionships, setPublicChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'my' | 'public'>('my');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedChampionship, setSelectedChampionship] = useState<Championship | null>(null);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [enrollLoading, setEnrollLoading] = useState(false);

  // Estados para busca avançada
  const [searchParams, setSearchParams] = useState({
    search: '',
    formato: '',
    dataInicio: '',
    dataFim: '',
    status: 'all',
    organizador: ''
  });
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showPrivateAccess, setShowPrivateAccess] = useState(false);
  const [privateCode, setPrivateCode] = useState('');

  useEffect(() => {
    loadChampionships();
  }, []);

  const loadChampionships = async () => {
    try {
      const [userResponse, publicResponse] = await Promise.all([
        championshipService.getUserChampionships(),
        championshipService.getPublicChampionships(activeTab === 'public' ? searchParams : undefined)
      ]);

      setUserChampionships(userResponse.championships);
      setPublicChampionships(publicResponse.championships);
    } catch (error: any) {
      setError('Erro ao carregar campeonatos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (activeTab === 'public') {
      setLoading(true);
      try {
        const response = await championshipService.getPublicChampionships(searchParams);
        setPublicChampionships(response.championships);
      } catch (error: any) {
        setError('Erro ao buscar campeonatos');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePrivateAccess = async () => {
    if (!privateCode.trim()) {
      alert('Por favor, digite o código do campeonato');
      return;
    }

    try {
      const championship = await championshipService.getChampionshipByCode(privateCode.trim());
      navigate(`/championships/${championship.id}`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Código inválido ou campeonato não encontrado');
    }
  };

  const resetSearch = () => {
    setSearchParams({
      search: '',
      formato: '',
      dataInicio: '',
      dataFim: '',
      status: 'all',
      organizador: ''
    });
  };

  useEffect(() => {
    if (activeTab === 'public') {
      handleSearch();
    }
  }, [searchParams]);

  const loadUserTeams = async () => {
    try {
      const response = await teamService.getUserTeams();
      setUserTeams(response.teams);
    } catch (error: any) {
      console.error('Erro ao carregar times:', error);
    }
  };

  const handleEnrollClick = async (championship: Championship) => {
    setSelectedChampionship(championship);
    await loadUserTeams();
    setShowEnrollModal(true);
  };

  const handleEnrollTeam = async (teamId: number) => {
    if (!selectedChampionship) return;

    setEnrollLoading(true);
    try {
      await championshipService.enrollTeam(selectedChampionship.id, teamId);
      alert('Time inscrito com sucesso!');
      setShowEnrollModal(false);
      setSelectedChampionship(null);
      // Recarregar dados para atualizar contadores
      loadChampionships();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao inscrever time');
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleGenerateMatches = async (championship: Championship) => {
    if (window.confirm(`Tem certeza que deseja gerar as chaves para o campeonato "${championship.nome}"? Esta ação não poderá ser desfeita.`)) {
      try {
        const response = await championshipService.generateMatches(championship.id);
        alert(`Chaves geradas com sucesso! ${response.totalMatches} partidas foram criadas.`);
        loadChampionships();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Erro ao gerar chaves do campeonato');
      }
    }
  };

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

  const theme = useTheme();

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Box textAlign="center">
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Carregando campeonatos...
          </Typography>
        </Box>
      </Container>
    );
  }

  const currentChampionships = activeTab === 'my' ? userChampionships : publicChampionships;

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
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <EmojiEvents sx={{ fontSize: 40 }} />
              <Typography variant="h4" fontWeight="bold">
                Campeonatos
              </Typography>
            </Box>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Dashboard />}
                onClick={() => navigate('/dashboard')}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
              >
                Dashboard
              </Button>
              <Button
                variant="contained"
                color="warning"
                startIcon={<Add />}
                onClick={() => navigate('/championships/new')}
                sx={{
                  bgcolor: alpha(theme.palette.warning.main, 0.9),
                  '&:hover': { bgcolor: theme.palette.warning.main }
                }}
              >
                Criar Campeonato
              </Button>
            </Box>
          </Box>
        </Paper>
      </Fade>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Barra de Busca e Acesso Privado */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            placeholder="Buscar campeonatos..."
            value={searchParams.search}
            onChange={(e) => setSearchParams(prev => ({ ...prev, search: e.target.value }))}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ flex: 1, minWidth: 250 }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            color="primary"
          >
            Busca Avançada
          </Button>
          <Button
            variant="outlined"
            startIcon={<Lock />}
            onClick={() => setShowPrivateAccess(!showPrivateAccess)}
            color="secondary"
          >
            Acesso Privado
          </Button>
        </Box>
      </Paper>

      {/* Busca Avançada */}
      {showAdvancedSearch && (
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ddd'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Filtros Avançados</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Formato:</label>
              <select
                value={searchParams.formato}
                onChange={(e) => setSearchParams(prev => ({ ...prev, formato: e.target.value }))}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">Todos os formatos</option>
                <option value="ELIMINACAO_SIMPLES">Eliminação Simples</option>
                <option value="ELIMINACAO_DUPLA">Eliminação Dupla</option>
                <option value="GRUPOS_ELIMINACAO">Grupos + Eliminação</option>
                <option value="PONTOS_CORRIDOS">Pontos Corridos</option>
                <option value="SUICO">Sistema Suíço</option>
                <option value="ROUND_ROBIN">Round Robin</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Data Início (De):</label>
              <input
                type="date"
                value={searchParams.dataInicio}
                onChange={(e) => setSearchParams(prev => ({ ...prev, dataInicio: e.target.value }))}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Data Início (Até):</label>
              <input
                type="date"
                value={searchParams.dataFim}
                onChange={(e) => setSearchParams(prev => ({ ...prev, dataFim: e.target.value }))}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Status:</label>
              <select
                value={searchParams.status}
                onChange={(e) => setSearchParams(prev => ({ ...prev, status: e.target.value }))}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="all">Todos</option>
                <option value="upcoming">Próximos</option>
                <option value="ongoing">Em Andamento</option>
                <option value="finished">Finalizados</option>
                <option value="open">Aceitando Inscrições</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Organizador:</label>
              <input
                type="text"
                placeholder="Nome do organizador"
                value={searchParams.organizador}
                onChange={(e) => setSearchParams(prev => ({ ...prev, organizador: e.target.value }))}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
          </div>
          <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
            <Button
              variant="contained"
              color="error"
              onClick={resetSearch}
              sx={{ borderRadius: 2 }}
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      )}

      {/* Acesso a Campeonato Privado */}
      {showPrivateAccess && (
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ddd'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Acessar Campeonato Privado</h3>
          <p style={{ marginBottom: '15px', color: '#666' }}>
            Digite o código fornecido pelo organizador para acessar um campeonato privado:
          </p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Digite o código (ex: ABC123)"
              value={privateCode}
              onChange={(e) => setPrivateCode(e.target.value.toUpperCase())}
              style={{
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                minWidth: '200px',
                textTransform: 'uppercase'
              }}
              maxLength={6}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handlePrivateAccess}
              sx={{ borderRadius: 2, px: 3 }}
            >
              Acessar
            </Button>
          </div>
        </div>
      )}

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
                <span>Meus Campeonatos</span>
                <Chip label={userChampionships.length} size="small" />
              </Box>
            }
            value="my"
          />
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <Visibility />
                <span>Campeonatos Públicos</span>
                <Chip label={publicChampionships.length} size="small" />
              </Box>
            }
            value="public"
          />
        </Tabs>
      </Paper>

      {/* Lista de Campeonatos */}
      {currentChampionships.length === 0 ? (
        <Paper elevation={2} sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <EmojiEvents sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" fontWeight="bold" color="text.primary" mb={1}>
            {activeTab === 'my' ? 'Nenhum campeonato criado' : 'Nenhum campeonato público disponível'}
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            {activeTab === 'my'
              ? 'Você ainda não criou nenhum campeonato. Que tal organizar seu primeiro torneio?'
              : 'Não há campeonatos públicos disponíveis no momento.'
            }
          </Typography>
          {activeTab === 'my' && (
            <Button
              variant="contained"
              color="warning"
              size="large"
              startIcon={<Add />}
              onClick={() => navigate('/championships/new')}
              sx={{ px: 4, py: 1.5 }}
            >
              Criar Meu Primeiro Campeonato
            </Button>
          )}
        </Paper>
      ) : (
        <Box
          display="grid"
          gridTemplateColumns={{
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)'
          }}
          gap={3}
        >
          {currentChampionships.map((championship, index) => (
            <Grow in timeout={600 + index * 100} key={championship.id}>
              <Card
                elevation={4}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 8
                  },
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box mb={2}>
                    <Typography variant="h6" fontWeight="bold" color="primary.main" mb={1}>
                      {championship.nome}
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      <Chip
                        label={championship.privado ? 'Privado' : 'Público'}
                        color={championship.privado ? 'default' : 'success'}
                        size="small"
                        icon={championship.privado ? <Lock /> : <Visibility />}
                      />
                      <Chip
                        label={formatChampionshipType(championship.formato)}
                        color="primary"
                        variant="outlined"
                        size="small"
                        icon={<Sports />}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ '& > div': { mb: 1 } }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Schedule fontSize="small" color="action" />
                      <Typography variant="body2">
                        <strong>Início:</strong> {new Date(championship.dataInicio).toLocaleDateString('pt-BR')}
                      </Typography>
                    </Box>
                    {championship.organizador && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <People fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>Organizador:</strong> {championship.organizador.nome}
                        </Typography>
                      </Box>
                    )}
                    <Box display="flex" alignItems="center" gap={1}>
                      <Sports fontSize="small" color="action" />
                      <Typography variant="body2">
                        <strong>Times:</strong> {championship._count?.inscricoes || 0}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" gap={1} mt={2} flexWrap="wrap">
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => navigate(`/championships/${championship.id}`)}
                      sx={{ flex: 1 }}
                    >
                      Ver Detalhes
                    </Button>

                    {activeTab === 'my' ? (
                      <>
                        <Button
                          variant="outlined"
                          color="secondary"
                          size="small"
                          startIcon={<PlayArrow />}
                          onClick={() => handleGenerateMatches(championship)}
                        >
                          Gerar Chaves
                        </Button>
                        <Button
                          variant="outlined"
                          color="info"
                          size="small"
                          startIcon={<Settings />}
                          onClick={() => navigate(`/championships/${championship.id}/manage`)}
                        >
                          Gerenciar
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="contained"
                        color="warning"
                        size="small"
                        startIcon={<PersonAdd />}
                        onClick={() => handleEnrollClick(championship)}
                      >
                        Inscrever Time
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grow>
          ))}
        </Box>
      )}

      {/* Modal de Inscrição Moderno */}
      <Dialog
        open={showEnrollModal && !!selectedChampionship}
        onClose={() => {
          setShowEnrollModal(false);
          setSelectedChampionship(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 2 }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h5" fontWeight="bold" color="primary.main">
              Inscrever Time
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {selectedChampionship?.nome}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          {userTeams.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Sports sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" mb={1}>Você ainda não tem times cadastrados</Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Crie um time primeiro para poder se inscrever em campeonatos
              </Typography>
              <Button
                variant="contained"
                color="warning"
                startIcon={<Add />}
                onClick={() => {
                  setShowEnrollModal(false);
                  navigate('/teams/new');
                }}
              >
                Criar Novo Time
              </Button>
            </Box>
          ) : (
            <Box display="grid" gap={2}>
              {userTeams.map((team) => (
                <Card
                  key={team.id}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      transform: 'translateY(-2px)',
                      boxShadow: 4
                    }
                  }}
                  onClick={() => handleEnrollTeam(team.id)}
                >
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={team.escudo}
                      sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}
                    >
                      <Sports />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {team.nome}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {team.jogadores?.length || 0} jogadores
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              setShowEnrollModal(false);
              setSelectedChampionship(null);
            }}
            variant="outlined"
            color="inherit"
            disabled={enrollLoading}
          >
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Championships;
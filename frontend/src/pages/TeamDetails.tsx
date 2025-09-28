import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Fade,
  Grow,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider
} from '@mui/material';
import {
  Groups,
  ArrowBack,
  Person,
  CalendarToday,
  PersonAdd,
  Sports,
  Delete,
  Close,
  Badge,
  SportsFootball
} from '@mui/icons-material';
import { teamService } from '../services/api';

interface Player {
  id: number;
  nome: string;
  posicao: string;
  numero: number;
}

interface Team {
  id: number;
  nome: string;
  escudo?: string;
  dataCriacao: string;
  jogadores: Player[];
  criador: {
    id: number;
    nome: string;
    email: string;
  };
}

const TeamDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    nome: '',
    posicao: '',
    numero: '',
  });

  useEffect(() => {
    if (id) {
      loadTeam();
    }
  }, [id]);

  const loadTeam = async () => {
    try {
      const response = await teamService.getTeamById(parseInt(id!));
      setTeam(response.team);
    } catch (error: any) {
      setError('Erro ao carregar detalhes do time');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;

    try {
      await teamService.addPlayer(team.id, {
        nome: newPlayer.nome,
        posicao: newPlayer.posicao,
        numero: parseInt(newPlayer.numero),
      });

      setNewPlayer({ nome: '', posicao: '', numero: '' });
      setShowAddPlayer(false);
      loadTeam(); // Recarregar dados do time
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao adicionar jogador');
    }
  };

  const handleRemovePlayer = async (playerId: number) => {
    if (!team) return;

    if (window.confirm('Tem certeza que deseja remover este jogador?')) {
      try {
        await teamService.removePlayer(team.id, playerId);
        loadTeam(); // Recarregar dados do time
      } catch (error: any) {
        alert('Erro ao remover jogador');
      }
    }
  };

  const theme = useTheme();

  const positionsOptions = [
    'Goleiro',
    'Zagueiro',
    'Lateral Direito',
    'Lateral Esquerdo',
    'Volante',
    'Meio-campo',
    'Meia Atacante',
    'Ponta Direita',
    'Ponta Esquerda',
    'Atacante',
    'Centroavante'
  ];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Box textAlign="center">
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Carregando detalhes do time...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error || !team) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Time não encontrado'}
        </Alert>
        <Button
          variant="contained"
          color="primary"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/teams')}
        >
          Voltar para Times
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
              <Groups sx={{ fontSize: 40 }} />
              <Typography variant="h4" fontWeight="bold">
                Detalhes do Time
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/teams')}
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

      {/* Informações do Time */}
      <Fade in timeout={1000}>
        <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 3 }}>
          <Box display="flex" alignItems="center" gap={3} mb={3}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 100,
                height: 100,
                fontSize: '2.5rem'
              }}
            >
              {team.escudo ? (
                <img
                  src={team.escudo}
                  alt={team.nome}
                  style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <Sports />
              )}
            </Avatar>
            <Box flex={1}>
              <Typography variant="h3" fontWeight="bold" color="text.primary" mb={2}>
                {team.nome}
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <Chip
                  icon={<CalendarToday />}
                  label={`Criado em ${new Date(team.dataCriacao).toLocaleDateString('pt-BR')}`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  icon={<Person />}
                  label={`Criador: ${team.criador.nome}`}
                  color="secondary"
                  variant="outlined"
                />
                <Chip
                  icon={<Groups />}
                  label={`${team.jogadores.length} jogadores`}
                  color="success"
                  variant="outlined"
                />
              </Box>
            </Box>
          </Box>
        </Paper>
      </Fade>

      {/* Lista de Jogadores */}
      <Fade in timeout={1200}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <Groups color="primary" />
              <Typography variant="h5" fontWeight="bold">
                Jogadores ({team.jogadores.length})
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PersonAdd />}
              onClick={() => setShowAddPlayer(true)}
              sx={{ borderRadius: 2 }}
            >
              Adicionar Jogador
            </Button>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {team.jogadores.length === 0 ? (
            <Paper elevation={1} sx={{ p: 6, textAlign: 'center', borderRadius: 3, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
              <SportsFootball sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" fontWeight="bold" color="text.primary" mb={1}>
                Nenhum jogador cadastrado ainda
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Clique em "Adicionar Jogador" para começar a montar seu time!
              </Typography>
            </Paper>
          ) : (
            <Box
              display="grid"
              gridTemplateColumns={{
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)'
              }}
              gap={2}
            >
              {team.jogadores.map((player, index) => (
                <Grow in timeout={800 + (index * 100)} key={player.id}>
                  <Card
                    elevation={2}
                    sx={{
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6
                      },
                      background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)'
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Badge sx={{ fontSize: 20, color: 'primary.main' }} />
                          <Typography variant="h6" fontWeight="bold" color="primary.main">
                            #{player.numero}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemovePlayer(player.id)}
                          sx={{ p: 0.5 }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                      <Typography variant="h6" fontWeight="bold" mb={1}>
                        {player.nome}
                      </Typography>
                      <Chip
                        label={player.posicao}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </CardContent>
                  </Card>
                </Grow>
              ))}
            </Box>
          )}
        </Paper>
      </Fade>

      {/* Modal para Adicionar Jogador */}
      <Dialog
        open={showAddPlayer}
        onClose={() => setShowAddPlayer(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <PersonAdd color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Adicionar Novo Jogador
              </Typography>
            </Box>
            <IconButton onClick={() => setShowAddPlayer(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleAddPlayer} sx={{ pt: 2 }}>
            <Box mb={3}>
              <TextField
                fullWidth
                label="Nome do Jogador"
                value={newPlayer.nome}
                onChange={(e) => setNewPlayer({...newPlayer, nome: e.target.value})}
                required
                autoFocus
                variant="outlined"
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Box>

            <Box mb={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Posição</InputLabel>
                <Select
                  value={newPlayer.posicao}
                  onChange={(e) => setNewPlayer({...newPlayer, posicao: e.target.value})}
                  label="Posição"
                  required
                >
                  {positionsOptions.map((position) => (
                    <MenuItem key={position} value={position}>
                      {position}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box mb={3}>
              <TextField
                fullWidth
                label="Número da Camisa"
                type="number"
                inputProps={{ min: 1, max: 99 }}
                value={newPlayer.numero}
                onChange={(e) => setNewPlayer({...newPlayer, numero: e.target.value})}
                required
                variant="outlined"
                InputProps={{
                  startAdornment: <Badge sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => setShowAddPlayer(false)}
            color="inherit"
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAddPlayer}
            variant="contained"
            color="primary"
            startIcon={<PersonAdd />}
            sx={{ borderRadius: 2 }}
          >
            Adicionar Jogador
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeamDetails;
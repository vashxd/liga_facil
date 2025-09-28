import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Fade,
  Grow,
  useTheme,
  alpha,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Groups,
  ArrowBack,
  Add,
  Visibility,
  Edit,
  Delete,
  Person,
  CalendarToday,
  Search,
  Sports
} from '@mui/icons-material';
import { teamService } from '../services/api';

interface Team {
  id: number;
  nome: string;
  escudo?: string;
  dataCriacao: string;
  jogadores: any[];
}

const Teams: React.FC = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const theme = useTheme();

  const filteredTeams = teams.filter(team =>
    team.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const response = await teamService.getUserTeams();
      setTeams(response.teams);
    } catch (error: any) {
      setError('Erro ao carregar times');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId: number) => {
    if (window.confirm('Tem certeza que deseja excluir este time?')) {
      try {
        // Implementar exclusão quando a API estiver pronta
        alert('Funcionalidade de exclusão será implementada em breve');
      } catch (error) {
        alert('Erro ao excluir time');
      }
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Box textAlign="center">
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Carregando times...
          </Typography>
        </Box>
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
                Meus Times
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<ArrowBack />}
                onClick={() => navigate('/dashboard')}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
              >
                Voltar
              </Button>
              <Button
                variant="contained"
                color="warning"
                startIcon={<Add />}
                onClick={() => navigate('/teams/new')}
                sx={{
                  bgcolor: 'rgba(255,111,0,0.9)',
                  '&:hover': { bgcolor: 'rgba(255,111,0,1)' }
                }}
              >
                Criar Time
              </Button>
            </Box>
          </Box>
        </Paper>
      </Fade>

      {error && (
        <Fade in timeout={600}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        </Fade>
      )}

      {/* Barra de Busca */}
      {teams.length > 0 && (
        <Fade in timeout={1000}>
          <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
            <TextField
              fullWidth
              placeholder="Buscar times..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
          </Paper>
        </Fade>
      )}

      {teams.length === 0 ? (
        <Fade in timeout={1200}>
          <Paper elevation={2} sx={{ p: 8, textAlign: 'center', borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <Sports sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
            <Typography variant="h4" fontWeight="bold" color="text.primary" mb={2}>
              Nenhum time encontrado
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={4}>
              Você ainda não criou nenhum time. Que tal começar criando seu primeiro time?
            </Typography>
            <Button
              variant="contained"
              color="warning"
              size="large"
              startIcon={<Add />}
              onClick={() => navigate('/teams/new')}
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                borderRadius: 2
              }}
            >
              Criar Meu Primeiro Time
            </Button>
          </Paper>
        </Fade>
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
          {filteredTeams.map((team, index) => (
            <Grow in timeout={800 + (index * 100)} key={team.id}>
              <Card
                elevation={3}
                sx={{
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 8
                  },
                  background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        width: 56,
                        height: 56,
                        fontSize: '1.5rem'
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
                      <Typography variant="h6" fontWeight="bold" mb={0.5}>
                        {team.nome}
                      </Typography>
                      <Chip
                        icon={<Person />}
                        label={`${team.jogadores?.length || 0} jogadores`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1} mb={3}>
                    <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Criado em {new Date(team.dataCriacao).toLocaleDateString('pt-BR')}
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 3, pt: 0, gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => navigate(`/teams/${team.id}`)}
                    sx={{ borderRadius: 2 }}
                  >
                    Ver
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => navigate(`/teams/${team.id}/edit`)}
                    sx={{ borderRadius: 2 }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<Delete />}
                    onClick={() => handleDeleteTeam(team.id)}
                    sx={{ borderRadius: 2 }}
                  >
                    Excluir
                  </Button>
                </CardActions>
              </Card>
            </Grow>
          ))}
        </Box>
      )}

      {/* Mensagem quando não há resultados da busca */}
      {teams.length > 0 && filteredTeams.length === 0 && (
        <Fade in timeout={600}>
          <Paper elevation={2} sx={{ p: 6, textAlign: 'center', borderRadius: 3, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
            <Search sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" fontWeight="bold" color="text.primary" mb={1}>
              Nenhum time encontrado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tente buscar com outros termos
            </Typography>
          </Paper>
        </Fade>
      )}
    </Container>
  );
};

export default Teams;
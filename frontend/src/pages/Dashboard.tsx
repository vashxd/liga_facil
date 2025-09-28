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
  Divider,
  Fade,
  Grow,
  useTheme,
  alpha
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  EmojiEvents,
  Groups,
  Sports,
  Add,
  Visibility,
  LogoutOutlined,
  TrendingUp,
  CalendarToday,
  Person
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { teamService, championshipService } from '../services/api';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    teams: 0,
    championships: 0,
    matches: 0,
  });
  const [recentTeams, setRecentTeams] = useState([]);
  const [recentChampionships, setRecentChampionships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [teamsResponse, championshipsResponse] = await Promise.all([
        teamService.getUserTeams(),
        championshipService.getUserChampionships(),
      ]);

      setStats({
        teams: teamsResponse.teams.length,
        championships: championshipsResponse.championships.length,
        matches: 0,
      });

      setRecentTeams(teamsResponse.teams.slice(0, 3));
      setRecentChampionships(championshipsResponse.championships.slice(0, 3));
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const theme = useTheme();

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Box textAlign="center">
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Carregando dashboard...
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
              <DashboardIcon sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  LigaFácil
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Bem-vindo, {user?.nome}!
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<LogoutOutlined />}
              onClick={handleLogout}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              Sair
            </Button>
          </Box>
        </Paper>
      </Fade>

      {/* Cards de Estatísticas */}
      <Box
        display="grid"
        gridTemplateColumns={{
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)'
        }}
        gap={3}
        mb={4}
      >
        <Grow in timeout={600}>
          <Card
            elevation={3}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-8px)', boxShadow: 8 }
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Groups sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h3" fontWeight="bold" mb={1}>
                {stats.teams}
              </Typography>
              <Typography variant="h6" mb={2}>
                Meus Times
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Add />}
                onClick={() => navigate('/teams/new')}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
              >
                Criar Time
              </Button>
            </CardActions>
          </Card>
        </Grow>

        <Grow in timeout={800}>
          <Card
            elevation={3}
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-8px)', boxShadow: 8 }
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <EmojiEvents sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h3" fontWeight="bold" mb={1}>
                {stats.championships}
              </Typography>
              <Typography variant="h6" mb={2}>
                Campeonatos
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Add />}
                onClick={() => navigate('/championships/new')}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
              >
                Criar Campeonato
              </Button>
            </CardActions>
          </Card>
        </Grow>

        <Grow in timeout={1000}>
          <Card
            elevation={3}
            sx={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-8px)', boxShadow: 8 }
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Sports sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h3" fontWeight="bold" mb={1}>
                {stats.matches}
              </Typography>
              <Typography variant="h6" mb={2}>
                Partidas
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Visibility />}
                onClick={() => navigate('/championships')}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
              >
                Ver Partidas
              </Button>
            </CardActions>
          </Card>
        </Grow>
      </Box>

      {/* Seções de Conteúdo */}
      <Box
        display="grid"
        gridTemplateColumns={{
          xs: '1fr',
          md: 'repeat(2, 1fr)'
        }}
        gap={3}
        mb={4}
      >
        {/* Times Recentes */}
        <Fade in timeout={1200}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Groups color="primary" />
              <Typography variant="h5" fontWeight="bold">
                Times Recentes
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {recentTeams.length > 0 ? (
              <Box>
                {recentTeams.map((team: any, index) => (
                  <Box key={team.id} sx={{ mb: 2 }}>
                    <Card variant="outlined" sx={{ p: 2, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) } }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
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
                        </Box>
                        <Chip
                          label={new Date(team.dataCriacao).toLocaleDateString('pt-BR')}
                          color="primary"
                          size="small"
                          icon={<CalendarToday />}
                        />
                      </Box>
                    </Card>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box textAlign="center" py={4}>
                <Sports sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  Você ainda não criou nenhum time
                </Typography>
              </Box>
            )}

            <Button
              variant="outlined"
              fullWidth
              startIcon={<Visibility />}
              onClick={() => navigate('/teams')}
              sx={{ mt: 2 }}
            >
              Ver Todos os Times
            </Button>
          </Paper>
        </Fade>

        {/* Campeonatos Recentes */}
        <Fade in timeout={1400}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <EmojiEvents color="primary" />
              <Typography variant="h5" fontWeight="bold">
                Campeonatos Recentes
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {recentChampionships.length > 0 ? (
              <Box>
                {recentChampionships.map((championship: any, index) => (
                  <Box key={championship.id} sx={{ mb: 2 }}>
                    <Card variant="outlined" sx={{ p: 2, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) } }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: 'warning.main' }}>
                            <EmojiEvents />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight="bold">
                              {championship.nome}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {championship.formato}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={championship.privado ? 'Privado' : 'Público'}
                          color={championship.privado ? 'default' : 'success'}
                          size="small"
                        />
                      </Box>
                    </Card>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box textAlign="center" py={4}>
                <EmojiEvents sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  Você ainda não criou nenhum campeonato
                </Typography>
              </Box>
            )}

            <Button
              variant="outlined"
              fullWidth
              startIcon={<Visibility />}
              onClick={() => navigate('/championships')}
              sx={{ mt: 2 }}
            >
              Ver Todos os Campeonatos
            </Button>
          </Paper>
        </Fade>
      </Box>

      {/* Footer */}
      <Fade in timeout={1600}>
        <Paper elevation={1} sx={{ p: 3, textAlign: 'center', borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
          <Typography variant="h6" fontWeight="bold" color="primary.main" mb={1}>
            🚀 LigaFácil - Sistema de Gestão de Campeonatos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Desenvolvido para a comunidade brasileira de futebol amador
          </Typography>
        </Paper>
      </Fade>
    </Container>
  );
};

export default Dashboard;
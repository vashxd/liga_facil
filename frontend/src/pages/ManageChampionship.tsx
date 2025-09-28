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
  Card,
  CardContent,
  Avatar,
  Chip,
  TextField,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fade,
  useTheme,
  alpha,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  People,
  PlayArrow,
  Settings,
  Sports,
  Warning,
  RemoveCircle,
  Save,
  Cancel
} from '@mui/icons-material';
import { championshipService } from '../services/api';

interface Championship {
  id: number;
  nome: string;
  formato: string;
  dataInicio: string;
  privado: boolean;
  codigo?: string;
  organizador: {
    id: number;
    nome: string;
  };
  _count?: {
    inscricoes: number;
  };
}

interface Enrollment {
  id: number;
  dataInscricao: string;
  time: {
    id: number;
    nome: string;
    escudo?: string;
    criador: {
      id: number;
      nome: string;
      email: string;
    };
    _count: {
      jogadores: number;
    };
  };
}

const ManageChampionship: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'enrollments' | 'matches' | 'standings'>('info');

  // Estados para edição
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    nome: '',
    formato: '',
    dataInicio: '',
    privado: false
  });

  // Estados para diálogos
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRemoveTeamDialog, setShowRemoveTeamDialog] = useState(false);
  const [teamToRemove, setTeamToRemove] = useState<Enrollment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const theme = useTheme();

  useEffect(() => {
    if (id) {
      loadChampionshipData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadChampionshipData = async () => {
    try {
      setLoading(true);
      const [championshipResponse, enrollmentsResponse] = await Promise.all([
        championshipService.getChampionshipById(Number(id)),
        championshipService.getChampionshipEnrollments(Number(id))
      ]);

      setChampionship(championshipResponse.championship);
      setEnrollments(enrollmentsResponse.enrollments);

      // Preencher formulário de edição
      setEditForm({
        nome: championshipResponse.championship.nome,
        formato: championshipResponse.championship.formato,
        dataInicio: championshipResponse.championship.dataInicio.split('T')[0],
        privado: championshipResponse.championship.privado
      });
    } catch (error: any) {
      setError('Erro ao carregar dados do campeonato');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    try {
      setActionLoading(true);
      await championshipService.updateChampionship(Number(id), editForm);
      setEditMode(false);
      await loadChampionshipData();
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao atualizar campeonato');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteChampionship = async () => {
    try {
      setActionLoading(true);
      await championshipService.deleteChampionship(Number(id));
      navigate('/championships', {
        state: { message: 'Campeonato deletado com sucesso' }
      });
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao deletar campeonato');
      setShowDeleteDialog(false);
      setActionLoading(false);
    }
  };

  const handleRemoveTeam = async () => {
    if (!teamToRemove) return;

    try {
      setActionLoading(true);
      await championshipService.removeTeamFromChampionship(Number(id), teamToRemove.time.id);
      setShowRemoveTeamDialog(false);
      setTeamToRemove(null);
      await loadChampionshipData();
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao remover time');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateMatches = async () => {
    try {
      setActionLoading(true);
      await championshipService.generateMatches(Number(id));
      setError('');
      // Navegar para a página de detalhes para ver as chaves geradas
      navigate(`/championships/${id}`);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao gerar chaves');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Box textAlign="center">
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Carregando dados do campeonato...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!championship) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Campeonato não encontrado
        </Alert>
      </Container>
    );
  }

  const renderInfoTab = () => (
    <Card elevation={3} sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight="bold">
            Informações do Campeonato
          </Typography>
          {!editMode ? (
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => setEditMode(true)}
            >
              Editar
            </Button>
          ) : (
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleEditSubmit}
                disabled={actionLoading}
              >
                Salvar
              </Button>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={() => setEditMode(false)}
                disabled={actionLoading}
              >
                Cancelar
              </Button>
            </Box>
          )}
        </Box>

        {editMode ? (
          <Box component="form" display="flex" flexDirection="column" gap={3}>
            <TextField
              fullWidth
              label="Nome do Campeonato"
              value={editForm.nome}
              onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Formato"
              value={editForm.formato}
              onChange={(e) => setEditForm({ ...editForm, formato: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Data de Início"
              type="date"
              value={editForm.dataInicio}
              onChange={(e) => setEditForm({ ...editForm, dataInicio: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Nome
              </Typography>
              <Typography variant="h6" mb={2}>
                {championship.nome}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Formato
              </Typography>
              <Typography variant="body1" mb={2}>
                {championship.formato}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Data de Início
              </Typography>
              <Typography variant="body1" mb={2}>
                {new Date(championship.dataInicio).toLocaleDateString('pt-BR')}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Tipo
              </Typography>
              <Chip
                label={championship.privado ? 'Privado' : 'Público'}
                color={championship.privado ? 'secondary' : 'primary'}
                sx={{ mb: 2 }}
              />
            </Box>

            {championship.privado && championship.codigo && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Código de Acesso
                </Typography>
                <Typography variant="h6" color="primary" fontFamily="monospace">
                  {championship.codigo}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Box display="flex" gap={2} flexWrap="wrap">
          <Button
            variant="contained"
            color="success"
            startIcon={<PlayArrow />}
            onClick={handleGenerateMatches}
            disabled={enrollments.length < 2 || actionLoading}
          >
            Gerar Chaves
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={() => setShowDeleteDialog(true)}
          >
            Deletar Campeonato
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const renderEnrollmentsTab = () => (
    <Card elevation={3} sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight="bold">
            Times Inscritos ({enrollments.length})
          </Typography>
        </Box>

        {enrollments.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Sports sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" mb={1}>
              Nenhum time inscrito
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Aguardando inscrições de times
            </Typography>
          </Box>
        ) : (
          <List>
            {enrollments.map((enrollment, index) => (
              <React.Fragment key={enrollment.id}>
                <ListItem sx={{ py: 2 }}>
                  <ListItemAvatar>
                    <Avatar
                      src={enrollment.time.escudo}
                      sx={{ bgcolor: 'primary.main', width: 50, height: 50 }}
                    >
                      <Sports />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="h6" fontWeight="bold">
                        {enrollment.time.nome}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Criador: {enrollment.time.criador.nome}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Jogadores: {enrollment.time._count.jogadores}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Inscrito em: {new Date(enrollment.dataInscricao).toLocaleDateString('pt-BR')}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      color="error"
                      onClick={() => {
                        setTeamToRemove(enrollment);
                        setShowRemoveTeamDialog(true);
                      }}
                    >
                      <RemoveCircle />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < enrollments.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
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
              <Settings sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  Gerenciar Campeonato
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  {championship.nome}
                </Typography>
              </Box>
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

      {/* Tabs */}
      <Paper elevation={2} sx={{ mb: 4, borderRadius: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="fullWidth"
          sx={{ px: 2, pt: 2 }}
        >
          <Tab
            icon={<Settings />}
            label="Informações"
            value="info"
            iconPosition="start"
          />
          <Tab
            icon={<People />}
            label="Inscrições"
            value="enrollments"
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Content */}
      <Fade in timeout={1000}>
        <Box>
          {activeTab === 'info' && renderInfoTab()}
          {activeTab === 'enrollments' && renderEnrollmentsTab()}
        </Box>
      </Fade>

      {/* Dialog de Confirmação - Deletar Campeonato */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" />
          Confirmar Exclusão
        </DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja deletar o campeonato "{championship.nome}"?
          </Typography>
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteChampionship}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Deletar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmação - Remover Time */}
      <Dialog open={showRemoveTeamDialog} onClose={() => setShowRemoveTeamDialog(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          Remover Time
        </DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja remover o time "{teamToRemove?.time.nome}" do campeonato?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRemoveTeamDialog(false)}>
            Cancelar
          </Button>
          <Button
            color="warning"
            variant="contained"
            onClick={handleRemoveTeam}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Remover'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManageChampionship;
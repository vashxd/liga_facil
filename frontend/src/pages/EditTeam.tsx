import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  TextField,
  Alert,
  CircularProgress,
  Fade,
  useTheme,
  alpha
} from '@mui/material';
import {
  Groups,
  ArrowBack,
  Save,
  Sports,
  Image,
  CheckCircle
} from '@mui/icons-material';
import { teamService } from '../services/api';

const EditTeam: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState({
    nome: '',
    escudo: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      loadTeam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadTeam = async () => {
    try {
      const response = await teamService.getTeamById(Number(id));
      setFormData({
        nome: response.time.nome,
        escudo: response.time.escudo || '',
      });
    } catch (error: any) {
      setError('Erro ao carregar dados do time');
      console.error(error);
    } finally {
      setLoadingTeam(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await teamService.updateTeam(Number(id), formData);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/teams/${id}`);
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao atualizar time');
    } finally {
      setLoading(false);
    }
  };

  const theme = useTheme();

  if (loadingTeam) {
    return (
      <Container maxWidth="sm" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Box textAlign="center">
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Carregando dados do time...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Fade in timeout={800}>
          <Paper elevation={4} sx={{ p: 6, textAlign: 'center', borderRadius: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CheckCircle sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h4" fontWeight="bold" mb={2}>
              Time atualizado com sucesso!
            </Typography>
            <Typography variant="body1" mb={3}>
              Redirecionando para os detalhes do time...
            </Typography>
            <CircularProgress size={30} sx={{ color: 'success.contrastText' }} />
          </Paper>
        </Fade>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
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
                Editar Time
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<ArrowBack />}
              onClick={() => navigate(`/teams/${id}`)}
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

      {/* Formulário Moderno */}
      <Fade in timeout={1000}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Box mb={3}>
              <TextField
                fullWidth
                label="Nome do Time"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                autoFocus
                placeholder="Ex: Barcelona FC"
                variant="outlined"
                InputProps={{
                  startAdornment: <Sports sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Box>

            <Box mb={4}>
              <TextField
                fullWidth
                label="URL do Escudo (opcional)"
                name="escudo"
                type="url"
                value={formData.escudo}
                onChange={handleChange}
                placeholder="Ex: https://exemplo.com/escudo.png"
                variant="outlined"
                InputProps={{
                  startAdornment: <Image sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                helperText="Cole o link de uma imagem para o escudo do seu time"
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Save />}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                borderRadius: 2
              }}
            >
              {loading ? 'Atualizando Time...' : 'Atualizar Time'}
            </Button>
          </Box>
        </Paper>
      </Fade>
    </Container>
  );
};

export default EditTeam;
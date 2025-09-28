import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const CreateTeam: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    escudo: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
      await teamService.createTeam(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao criar time');
    } finally {
      setLoading(false);
    }
  };

  const theme = useTheme();

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Fade in timeout={800}>
          <Paper elevation={4} sx={{ p: 6, textAlign: 'center', borderRadius: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CheckCircle sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h4" fontWeight="bold" mb={2}>
              Time criado com sucesso!
            </Typography>
            <Typography variant="body1" mb={3}>
              Redirecionando para o dashboard...
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
                Criar Novo Time
              </Typography>
            </Box>
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
              {loading ? 'Criando Time...' : 'Criar Time'}
            </Button>
          </Box>
        </Paper>
      </Fade>
    </Container>
  );
};

export default CreateTeam;
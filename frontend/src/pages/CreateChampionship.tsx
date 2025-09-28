import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Divider,
  Fade,
  useTheme,
  alpha,
  Card,
  CardContent
} from '@mui/material';
import {
  EmojiEvents,
  ArrowBack,
  Save,
  Sports,
  Schedule,
  Lock,
  Public,
  CheckCircle
} from '@mui/icons-material';
import { championshipService } from '../services/api';

const CreateChampionship: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    formato: 'ELIMINACAO_SIMPLES',
    dataInicio: '',
    privado: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const formatosDisponiveis = [
    { value: 'ELIMINACAO_SIMPLES', label: 'Eliminação Simples' },
    { value: 'ELIMINACAO_DUPLA', label: 'Eliminação Dupla' },
    { value: 'GRUPOS_ELIMINACAO', label: 'Grupos + Eliminação' },
    { value: 'PONTOS_CORRIDOS', label: 'Pontos Corridos' },
    { value: 'SUICO', label: 'Sistema Suíço' },
    { value: 'ROUND_ROBIN', label: 'Round Robin' },
    { value: 'MATA_MATA_GRUPOS', label: 'Mata-mata com Grupos' },
    { value: 'PLAYOFF', label: 'Playoff' },
    { value: 'LIGA_ASCENSO', label: 'Liga com Ascenso' },
    { value: 'TORNEIO_DUPLO', label: 'Torneio Duplo' },
    { value: 'CLASSIFICATORIO', label: 'Classificatório' },
    { value: 'COPA_LIGA', label: 'Copa Liga' },
    { value: 'CHAMPIONS', label: 'Champions' },
    { value: 'MUNDIAL', label: 'Mundial' },
    { value: 'REGIONAL', label: 'Regional' },
    { value: 'ESTADUAL', label: 'Estadual' },
    { value: 'MUNICIPAL', label: 'Municipal' },
    { value: 'AMISTOSO', label: 'Amistoso' },
    { value: 'FESTIVAL', label: 'Festival' },
    { value: 'EXHIBITION', label: 'Exhibition' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    setFormData({
      ...formData,
      [target.name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await championshipService.createChampionship(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao criar campeonato');
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
              Campeonato criado com sucesso!
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
              <EmojiEvents sx={{ fontSize: 40 }} />
              <Typography variant="h4" fontWeight="bold">
                Criar Campeonato
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
                label="Nome do Campeonato"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                autoFocus
                placeholder="Ex: Copa Libertadores 2024"
                variant="outlined"
                InputProps={{
                  startAdornment: <Sports sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Box>

            <Box mb={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Formato do Campeonato</InputLabel>
                <Select
                  name="formato"
                  value={formData.formato}
                  onChange={handleChange}
                  label="Formato do Campeonato"
                  required
                >
                  {formatosDisponiveis.map((formato) => (
                    <MenuItem key={formato.value} value={formato.value}>
                      {formato.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box mb={3}>
              <TextField
                fullWidth
                label="Data e Hora de Início"
                name="dataInicio"
                type="datetime-local"
                value={formData.dataInicio}
                onChange={handleChange}
                required
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <Schedule sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Box>

            <Box mb={4}>
              <Card
                variant="outlined"
                sx={{
                  bgcolor: formData.privado ? alpha(theme.palette.warning.main, 0.1) : alpha(theme.palette.success.main, 0.1),
                  borderColor: formData.privado ? 'warning.main' : 'success.main',
                  transition: 'all 0.3s ease'
                }}
              >
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        name="privado"
                        checked={formData.privado}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        {formData.privado ? <Lock /> : <Public />}
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            {formData.privado ? 'Campeonato Privado' : 'Campeonato Público'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formData.privado
                              ? 'Apenas times com código podem se inscrever'
                              : 'Qualquer time pode se inscrever'
                            }
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </CardContent>
              </Card>
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
              {loading ? 'Criando Campeonato...' : 'Criar Campeonato'}
            </Button>
          </Box>
        </Paper>
      </Fade>
    </Container>
  );
};

export default CreateChampionship;
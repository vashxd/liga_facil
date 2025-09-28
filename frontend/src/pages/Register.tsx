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
  alpha,
  Link
} from '@mui/material';
import {
  Sports,
  PersonAdd,
  Person,
  Email,
  Lock,
  LockOutlined,
  Login as LoginIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.senha !== formData.confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.senha.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres');
      return;
    }

    setLoading(true);

    try {
      await register(formData.nome, formData.email, formData.senha);
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
        p: 2
      }}
    >
      <Container maxWidth="sm">
        <Fade in timeout={800}>
          <Paper
            elevation={8}
            sx={{
              p: 6,
              borderRadius: 4,
              background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                left: -50,
                width: 150,
                height: 150,
                background: alpha(theme.palette.secondary.main, 0.05),
                borderRadius: '50%'
              }}
            />

            {/* Header */}
            <Box textAlign="center" mb={4}>
              <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={2}>
                <Sports sx={{ fontSize: 48, color: 'primary.main' }} />
                <Typography variant="h3" fontWeight="bold" color="primary.main">
                  LigaFácil
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="text.secondary" mb={1}>
                Cadastrar
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Crie sua conta e comece a organizar campeonatos
              </Typography>
            </Box>

            {error && (
              <Fade in timeout={400}>
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              </Fade>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Box mb={3}>
                <TextField
                  fullWidth
                  label="Nome completo"
                  name="nome"
                  type="text"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                  autoFocus
                  variant="outlined"
                  InputProps={{
                    startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Box>

              <Box mb={3}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  InputProps={{
                    startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Box>

              <Box mb={3}>
                <TextField
                  fullWidth
                  label="Senha"
                  name="senha"
                  type="password"
                  value={formData.senha}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  helperText="Mínimo 8 caracteres"
                  InputProps={{
                    startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Box>

              <Box mb={4}>
                <TextField
                  fullWidth
                  label="Confirmar senha"
                  name="confirmarSenha"
                  type="password"
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  InputProps={{
                    startAdornment: <LockOutlined sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Box>

              <Button
                type="submit"
                variant="contained"
                color="secondary"
                size="large"
                fullWidth
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <PersonAdd />}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  mb: 3
                }}
              >
                {loading ? 'Criando conta...' : 'Criar conta'}
              </Button>
            </Box>

            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary" mb={1}>
                Já tem uma conta?
              </Typography>
              <Link
                component="button"
                variant="body1"
                onClick={() => navigate('/login')}
                sx={{
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  color: 'secondary.main',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                <LoginIcon fontSize="small" />
                Faça login aqui
              </Link>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default Register;
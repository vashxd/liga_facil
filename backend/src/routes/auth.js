const express = require('express');
const {
  register,
  login,
  verifyToken,
  registerValidation,
  loginValidation
} = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register - Registrar usuário
router.post('/register', registerValidation, register);

// POST /api/auth/login - Login de usuário
router.post('/login', loginValidation, login);

// GET /api/auth/verify - Verificar token
router.get('/verify', auth, verifyToken);

module.exports = router;
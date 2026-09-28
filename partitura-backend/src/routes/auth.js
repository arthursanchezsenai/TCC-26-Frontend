const express = require('express');
const controller = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();
router.post('/registro', controller.registro);
router.post('/login', controller.login);
router.get('/perfil', auth(), controller.perfil);
router.put('/perfil', auth(), controller.atualizarPerfil);

module.exports = router;

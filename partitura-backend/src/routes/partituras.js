const express = require('express');
const controller = require('../controllers/partiturasController');
const auth = require('../middleware/auth');

const router = express.Router();
router.get('/', auth(false), controller.listar);
router.post('/', auth(), controller.criar);
router.get('/usuario/:id', auth(false), controller.porUsuario);
router.get('/:id/comentarios', controller.listarComentarios);
router.post('/:id/comentarios', auth(), controller.criarComentario);
router.post('/:id/curtir', auth(), controller.curtir);
router.get('/:id', auth(false), controller.buscar);
router.put('/:id', auth(), controller.atualizar);
router.delete('/:id', auth(), controller.remover);

module.exports = router;

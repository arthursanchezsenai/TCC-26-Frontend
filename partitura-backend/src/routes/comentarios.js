const express = require('express');
const controller = require('../controllers/partiturasController');
const auth = require('../middleware/auth');

const router = express.Router();
router.delete('/:id', auth(), controller.removerComentario);

module.exports = router;

const jwt = require('jsonwebtoken');
const db = require('../database/db');

function auth(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      if (!required) return next();
      return res.status(401).json({ erro: 'Token de autenticação não informado.' });
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'partitura_tcc_secret');
      req.usuario = db.prepare('SELECT id, nome, email, bio, avatar, criado_em FROM usuarios WHERE id = ?').get(payload.id);
      if (!req.usuario) return res.status(401).json({ erro: 'Usuário não encontrado.' });
      next();
    } catch (error) {
      return res.status(401).json({ erro: 'Token inválido ou expirado.' });
    }
  };
}

module.exports = auth;

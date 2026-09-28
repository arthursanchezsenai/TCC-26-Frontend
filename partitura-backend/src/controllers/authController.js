const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');

function tokenFor(user) {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'partitura_tcc_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function publicUser(user) {
  return { id: user.id, nome: user.nome, email: user.email, bio: user.bio, avatar: user.avatar, criado_em: user.criado_em };
}

exports.registro = (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios.' });
  if (senha.length < 6) return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' });
  const normalizedEmail = String(email).trim().toLowerCase();
  if (db.prepare('SELECT id FROM usuarios WHERE email = ?').get(normalizedEmail)) {
    return res.status(409).json({ erro: 'Este email já está cadastrado.' });
  }
  const result = db.prepare('INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)').run(
    String(nome).trim(), normalizedEmail, bcrypt.hashSync(senha, 10),
  );
  const user = db.prepare('SELECT id, nome, email, bio, avatar, criado_em FROM usuarios WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ token: tokenFor(user), usuario: publicUser(user) });
};

exports.login = (req, res) => {
  const { email, senha } = req.body;
  const user = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(String(email || '').trim().toLowerCase());
  if (!user || !bcrypt.compareSync(senha || '', user.senha)) return res.status(401).json({ erro: 'Email ou senha inválidos.' });
  res.json({ token: tokenFor(user), usuario: publicUser(user) });
};

exports.perfil = (req, res) => res.json({ usuario: req.usuario });

exports.atualizarPerfil = (req, res) => {
  const { nome, bio, avatar } = req.body;
  const user = db.prepare('UPDATE usuarios SET nome = COALESCE(?, nome), bio = COALESCE(?, bio), avatar = COALESCE(?, avatar) WHERE id = ?')
    .run(nome, bio, avatar, req.usuario.id);
  if (!user.changes) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  res.json({ usuario: db.prepare('SELECT id, nome, email, bio, avatar, criado_em FROM usuarios WHERE id = ?').get(req.usuario.id) });
};

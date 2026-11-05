const db = require('../database/db');

const generos = new Set(['classico', 'jazz', 'mpb', 'popular', 'contemporaneo']);

function parseScore(row, usuarioId) {
  if (!row) return null;
  let notas = [];
  try { notas = JSON.parse(row.notas_json || '[]'); } catch (_) { notas = []; }
  return {
    id: row.id,
    usuario_id: row.usuario_id,
    titulo: row.titulo,
    compositor: row.compositor,
    genero: row.genero,
    tonalidade: row.tonalidade,
    descricao: row.descricao,
    notas_json: notas,
    publica: Boolean(row.publica),
    curtidas: row.curtidas || 0,
    comentarios: row.total_comentarios || 0,
    gostei: usuarioId ? Boolean(row.gostei) : false,
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em,
  };
}

const scoreSelect = `
  SELECT p.*, u.nome AS nome_usuario,
    (SELECT COUNT(*) FROM curtidas c WHERE c.partitura_id = p.id) AS curtidas,
    (SELECT COUNT(*) FROM comentarios c WHERE c.partitura_id = p.id) AS total_comentarios,
    CASE WHEN ? IS NOT NULL AND EXISTS (
      SELECT 1 FROM curtidas c2 WHERE c2.partitura_id = p.id AND c2.usuario_id = ?
    ) THEN 1 ELSE 0 END AS gostei
  FROM partituras p JOIN usuarios u ON u.id = p.usuario_id
`;

exports.listar = (req, res) => {
  const { genero, busca, ordem = 'recente' } = req.query;
  const pagina = Math.max(Number.parseInt(req.query.pagina, 10) || 1, 1);
  const limite = Math.min(Math.max(Number.parseInt(req.query.limite, 10) || 9, 1), 30);
  const where = ['p.publica = 1'];
  const params = [req.usuario ? req.usuario.id : null, req.usuario ? req.usuario.id : null];
  if (genero && generos.has(genero)) { where.push('p.genero = ?'); params.push(genero); }
  if (busca) {
    where.push('(p.titulo LIKE ? OR p.compositor LIKE ? OR p.descricao LIKE ?)');
    const term = `%${busca}%`; params.push(term, term, term);
  }
  const order = { recente: 'p.criado_em DESC', antiga: 'p.criado_em ASC', curtidas: 'curtidas DESC', titulo: 'p.titulo COLLATE NOCASE ASC' }[ordem] || 'p.criado_em DESC';
  const countParams = params.slice(2);
  const total = db.prepare(`SELECT COUNT(*) AS total FROM partituras p WHERE ${where.join(' AND ')}`).get(...countParams).total;
  params.push((pagina - 1) * limite, limite);
  const rows = db.prepare(`${scoreSelect} WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT ? OFFSET ?`).all(...params.slice(0, 2), ...params.slice(2));
  res.json({ partituras: rows.map(row => parseScore(row, req.usuario && req.usuario.id)), pagina, limite, total, paginas: Math.ceil(total / limite) });
};

exports.buscar = (req, res) => {
  const row = db.prepare(`${scoreSelect} WHERE p.id = ? AND (p.publica = 1 OR p.usuario_id = ?)`).get(
    req.usuario ? req.usuario.id : null, req.usuario ? req.usuario.id : null, req.params.id, req.usuario ? req.usuario.id : -1,
  );
  if (!row) return res.status(404).json({ erro: 'Partitura não encontrada.' });
  res.json({ partitura: parseScore(row, req.usuario && req.usuario.id) });
};

function validateBody(body) {
  const required = ['titulo', 'compositor', 'genero'];
  if (required.some(field => !body[field])) return 'Título, compositor e gênero são obrigatórios.';
  if (!generos.has(body.genero)) return 'Gênero inválido.';
  return null;
}

exports.criar = (req, res) => {
  const error = validateBody(req.body);
  if (error) return res.status(400).json({ erro: error });
  const { titulo, compositor, genero, tonalidade = '', descricao = '', notas_json = [], publica = true } = req.body;
  const result = db.prepare(`INSERT INTO partituras
    (usuario_id, titulo, compositor, genero, tonalidade, descricao, notas_json, publica)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    req.usuario.id, titulo, compositor, genero, tonalidade, descricao, JSON.stringify(notas_json), publica ? 1 : 0,
  );
  const row = db.prepare(`${scoreSelect} WHERE p.id = ? AND p.usuario_id = ?`).get(req.usuario.id, req.usuario.id, result.lastInsertRowid, req.usuario.id);
  res.status(201).json({ partitura: parseScore(row, req.usuario.id) });
};

exports.atualizar = (req, res) => {
  const existing = db.prepare('SELECT id FROM partituras WHERE id = ? AND usuario_id = ?').get(req.params.id, req.usuario.id);
  if (!existing) return res.status(404).json({ erro: 'Partitura não encontrada ou sem permissão.' });
  const error = validateBody(req.body);
  if (error) return res.status(400).json({ erro: error });
  const { titulo, compositor, genero, tonalidade = '', descricao = '', notas_json = [], publica = true } = req.body;
  db.prepare(`UPDATE partituras SET titulo = ?, compositor = ?, genero = ?, tonalidade = ?, descricao = ?, notas_json = ?, publica = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(titulo, compositor, genero, tonalidade, descricao, JSON.stringify(notas_json), publica ? 1 : 0, req.params.id);
  const row = db.prepare(`${scoreSelect} WHERE p.id = ? AND p.usuario_id = ?`).get(req.usuario.id, req.usuario.id, req.params.id, req.usuario.id);
  res.json({ partitura: parseScore(row, req.usuario.id) });
};

exports.remover = (req, res) => {
  const result = db.prepare('DELETE FROM partituras WHERE id = ? AND usuario_id = ?').run(req.params.id, req.usuario.id);
  if (!result.changes) return res.status(404).json({ erro: 'Partitura não encontrada ou sem permissão.' });
  res.status(204).send();
};

exports.curtir = (req, res) => {
  const score = db.prepare('SELECT id FROM partituras WHERE id = ? AND publica = 1').get(req.params.id);
  if (!score) return res.status(404).json({ erro: 'Partitura não encontrada.' });
  const existing = db.prepare('SELECT 1 FROM curtidas WHERE usuario_id = ? AND partitura_id = ?').get(req.usuario.id, req.params.id);
  if (existing) db.prepare('DELETE FROM curtidas WHERE usuario_id = ? AND partitura_id = ?').run(req.usuario.id, req.params.id);
  else db.prepare('INSERT INTO curtidas (usuario_id, partitura_id) VALUES (?, ?)').run(req.usuario.id, req.params.id);
  const total = db.prepare('SELECT COUNT(*) AS total FROM curtidas WHERE partitura_id = ?').get(req.params.id).total;
  res.json({ gostei: !existing, curtidas: total });
};

exports.listarComentarios = (req, res) => {
  const comments = db.prepare(`SELECT c.id, c.texto, c.criado_em, u.id AS usuario_id, u.nome
    FROM comentarios c JOIN usuarios u ON u.id = c.usuario_id
    WHERE c.partitura_id = ? ORDER BY c.criado_em DESC`).all(req.params.id);
  res.json({ comentarios: comments });
};

exports.criarComentario = (req, res) => {
  const texto = String(req.body.texto || '').trim();
  if (!texto) return res.status(400).json({ erro: 'O comentário não pode estar vazio.' });
  const score = db.prepare('SELECT id FROM partituras WHERE id = ? AND publica = 1').get(req.params.id);
  if (!score) return res.status(404).json({ erro: 'Partitura não encontrada.' });
  const result = db.prepare('INSERT INTO comentarios (usuario_id, partitura_id, texto) VALUES (?, ?, ?)').run(req.usuario.id, req.params.id, texto);
  const comment = db.prepare(`SELECT c.id, c.texto, c.criado_em, u.id AS usuario_id, u.nome
    FROM comentarios c JOIN usuarios u ON u.id = c.usuario_id WHERE c.id = ?`).get(result.lastInsertRowid);
  res.status(201).json({ comentario: comment });
};

exports.removerComentario = (req, res) => {
  const result = db.prepare('DELETE FROM comentarios WHERE id = ? AND usuario_id = ?').run(req.params.id, req.usuario.id);
  if (!result.changes) return res.status(404).json({ erro: 'Comentário não encontrado ou sem permissão.' });
  res.status(204).send();
};

exports.porUsuario = (req, res) => {
  const rows = db.prepare(`${scoreSelect} WHERE p.usuario_id = ? AND (p.publica = 1 OR p.usuario_id = ?) ORDER BY p.criado_em DESC`)
    .all(req.usuario ? req.usuario.id : null, req.usuario ? req.usuario.id : null, req.params.id, req.params.id);
  res.json({ partituras: rows.map(row => parseScore(row, req.usuario && req.usuario.id)) });
};

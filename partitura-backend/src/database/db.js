const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, '..', '..', 'partitura.db'));
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    bio TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS partituras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    compositor TEXT NOT NULL,
    genero TEXT NOT NULL,
    tonalidade TEXT DEFAULT '',
    descricao TEXT DEFAULT '',
    notas_json TEXT NOT NULL DEFAULT '[]',
    publica INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS curtidas (
    usuario_id INTEGER NOT NULL,
    partitura_id INTEGER NOT NULL,
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, partitura_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (partitura_id) REFERENCES partituras(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS comentarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    partitura_id INTEGER NOT NULL,
    texto TEXT NOT NULL,
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (partitura_id) REFERENCES partituras(id) ON DELETE CASCADE
  );
`);

const userCount = db.prepare('SELECT COUNT(*) AS total FROM usuarios').get().total;
if (userCount === 0) {
  const insertUser = db.prepare('INSERT INTO usuarios (nome, email, senha, bio) VALUES (?, ?, ?, ?)');
  const password = bcrypt.hashSync('senha123', 10);
  const users = [
    ['Ana Beatriz Silva', 'ana@partitura.com', password, 'Compositora e pianista.'],
    ['Rodrigo Santos', 'rodrigo@partitura.com', password, 'Músico apaixonado por jazz.'],
    ['Mariana Costa', 'mariana@partitura.com', password, 'Compositora de MPB.'],
  ];
  const ids = users.map(user => insertUser.run(...user).lastInsertRowid);
  const insertScore = db.prepare(`INSERT INTO partituras
    (usuario_id, titulo, compositor, genero, tonalidade, descricao, notas_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);
  [
    [ids[0], 'Noturno em Dó menor', users[0][0], 'classico', 'Dó menor', 'Peça intimista para piano.', [{ tipo: 'seminima', pitchOffset: 0 }]],
    [ids[1], 'Blues da Madrugada', users[1][0], 'jazz', 'Sol maior', 'Um blues noturno.', [{ tipo: 'colcheia', pitchOffset: 1 }]],
    [ids[2], 'Bossa de Outono', users[2][0], 'mpb', 'Ré maior', 'Bossa nova para violão.', [{ tipo: 'minima', pitchOffset: -1 }]],
  ].forEach(score => insertScore.run(score[0], score[1], score[2], score[3], score[4], score[5], JSON.stringify(score[6])));
}

module.exports = db;

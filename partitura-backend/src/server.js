require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
require('./database/db');

const authRoutes = require('./routes/auth');
const partiturasRoutes = require('./routes/partituras');
const comentariosRoutes = require('./routes/comentarios');

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '..', '..')));

app.get('/api/health', (_req, res) => {
	res.json({ status: 'ok', servico: 'partitura-backend' });
});
app.use('/api/auth', authRoutes);
app.use('/api/partituras', partiturasRoutes);
app.use('/api/comentarios', comentariosRoutes);

app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));
app.use((error, _req, res, _next) => {
	console.error(error);
	res.status(500).json({ erro: 'Erro interno do servidor.' });
});

if (require.main === module) {
	app.listen(port, () => console.log(`Servidor rodando em http://localhost:${port}`));
}

module.exports = app;

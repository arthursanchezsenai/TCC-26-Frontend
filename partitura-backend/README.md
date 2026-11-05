# 🎼 Partitura — Backend (Node.js)

Backend do TCC — Plataforma de Criação e Divulgação de Partituras Musicais.

---

## 🚀 Como rodar

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior

### 2. Instalação

```bash
# Entre na pasta do backend
cd partitura-backend

# Instale as dependências
npm install

# Inicie o servidor (modo produção)
npm start

# OU em modo desenvolvimento (reinicia automaticamente ao salvar)
npm run dev
```

O servidor sobe em **http://localhost
:3000**

---

## 📁 Estrutura de Arquivos

```
partitura-backend/
├── src/
│   ├── server.js                  ← Ponto de entrada
│   ├── database/
│   │   └── db.js                  ← SQLite + criação de tabelas + seed
│   ├── middleware/
│   │   └── auth.js                ← Verificação JWT
│   ├── controllers/
│   │   ├── authController.js      ← Registro, login, perfil
│   │   └── partiturasController.js← CRUD + curtidas + comentários
│   └── routes/
│       ├── auth.js                ← Rotas /api/auth/*
│       └── partituras.js          ← Rotas /api/partituras/*
├── uploads/                       ← Arquivos enviados (futuro)
├── partitura.db                   ← Banco SQLite (criado automaticamente)
├── .env                           ← Variáveis de ambiente
├── .env.example                   ← Modelo do .env
└── package.json
```

---

## 🗄️ Banco de Dados

Usa **SQLite** via `better-sqlite3` — sem necessidade de instalar nenhum servidor de banco de dados.

O arquivo `partitura.db` é criado automaticamente na primeira execução, junto com dados de exemplo (seed).

**Tabelas:**
| Tabela       | Descrição                          |
|--------------|------------------------------------|
| `usuarios`   | Contas de usuário                  |
| `partituras` | Composições publicadas             |
| `curtidas`   | Relacionamento usuário ↔ partitura |
| `comentarios`| Comentários nas partituras         |

**Usuários de teste (senha: `senha123`):**
- `ana@partitura.com`
- `rodrigo@partitura.com`
- `mariana@partitura.com`

---

## 📡 Documentação da API

Base URL: `http://localhost:3000`

### Autenticação

| Método | Rota                | Auth? | Descrição              |
|--------|---------------------|-------|------------------------|
| POST   | `/api/auth/registro`| Não   | Criar conta            |
| POST   | `/api/auth/login`   | Não   | Login + retorna token  |
| GET    | `/api/auth/perfil`  | Sim   | Ver perfil logado      |
| PUT    | `/api/auth/perfil`  | Sim   | Editar perfil          |

#### Registro
```json
POST /api/auth/registro
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "senha": "minhasenha123"
}
```

#### Login
```json
POST /api/auth/login
{
  "email": "joao@email.com",
  "senha": "minhasenha123"
}
// Resposta: { token: "eyJ...", usuario: {...} }
```

Para rotas autenticadas, envie o token no header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Partituras

| Método | Rota                               | Auth? | Descrição                    |
|--------|------------------------------------|-------|------------------------------|
| GET    | `/api/partituras`                  | Não   | Listar com filtros           |
| POST   | `/api/partituras`                  | Sim   | Criar partitura              |
| GET    | `/api/partituras/:id`              | Não   | Buscar por ID                |
| PUT    | `/api/partituras/:id`              | Sim   | Atualizar (somente dono)     |
| DELETE | `/api/partituras/:id`              | Sim   | Excluir (somente dono)       |
| POST   | `/api/partituras/:id/curtir`       | Sim   | Toggle curtida               |
| GET    | `/api/partituras/:id/comentarios`  | Não   | Listar comentários           |
| POST   | `/api/partituras/:id/comentarios`  | Sim   | Adicionar comentário         |
| DELETE | `/api/comentarios/:id`             | Sim   | Excluir comentário (dono)    |
| GET    | `/api/partituras/usuario/:id`      | Não   | Partituras de um usuário     |

#### Listar partituras (query params)
```
GET /api/partituras?genero=jazz&busca=blues&pagina=1&limite=9&ordem=curtidas
```
- `genero`: classico | jazz | mpb | popular | contemporaneo
- `busca`: texto livre (título, compositor, descrição)
- `pagina`: número da página (padrão: 1)
- `limite`: itens por página (padrão: 9, máx: 30)
- `ordem`: recente | antiga | curtidas | titulo

#### Criar partitura
```json
POST /api/partituras
Authorization: Bearer <token>
{
  "titulo": "Minha Sonata",
  "compositor": "João Silva",
  "genero": "classico",
  "tonalidade": "Dó maior",
  "descricao": "Uma peça para piano solo.",
  "notas_json": [{"x": 100, "y": 80, "tipo": "seminima"}],
  "publica": true
}
```

---

## 🔗 Conectando ao Frontend

No arquivo `script.js` do frontend, substitua as chamadas mock pela API real:

```javascript
// Exemplo: buscar partituras
const res = await fetch('http://localhost:3000/api/partituras?genero=jazz');
const data = await res.json();
console.log(data.partituras);

// Exemplo: login
const res = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'ana@partitura.com', senha: 'senha123' })
});
const { token, usuario } = await res.json();
localStorage.setItem('token', token);

// Exemplo: criar partitura (autenticado)
const token = localStorage.getItem('token');
const res = await fetch('http://localhost:3000/api/partituras', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ titulo: 'Nova Peça', compositor: 'Eu', genero: 'mpb' })
});
```

---

## 🛠️ Dependências

| Pacote          | Finalidade                                  |
|-----------------|---------------------------------------------|
| `express`       | Framework web                               |
| `better-sqlite3`| Banco de dados SQLite síncrono              |
| `bcryptjs`      | Hash seguro de senhas                       |
| `jsonwebtoken`  | Autenticação via JWT                        |
| `cors`          | Permite requisições do frontend             |
| `dotenv`        | Carrega variáveis do arquivo .env           |
| `multer`        | Upload de arquivos (para próximas versões)  |
| `nodemon`       | Reinicia o servidor em desenvolvimento      |

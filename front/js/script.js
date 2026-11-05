/* ============================================================
   PARTITURA — script.js
   Módulos: Loader | Header | Hero | Cards | Editor Canvas
            (com regra de tempo + reprodução de áudio) |
            Stats | Filtros | Modal | Formulário | Toast
   ============================================================ */
 
import { CLEF_SYMBOLS, DURATIONS } from './modules/music-theory.js';
import { initializePlayback } from './modules/playback.js';
import { $, $$ } from './modules/dom.js';
import { initializeUI, showToast } from './modules/ui.js';

'use strict';
 
initializeUI();
 
/* ============================================================
   5. DADOS MOCK DAS PARTITURAS
   ============================================================ */
const partiturasMock = [
  { id: 1, titulo: 'Noturno em Dó menor', compositor: 'Ana Beatriz Silva', genero: 'classico', likes: 247, clef: '𝄞' },
  { id: 2, titulo: 'Blues da Madrugada',   compositor: 'Rodrigo Santos',    genero: 'jazz',    likes: 183, clef: '𝄢' },
  { id: 3, titulo: 'Bossa de Outono',       compositor: 'Mariana Costa',    genero: 'mpb',     likes: 312, clef: '𝄞' },
  { id: 4, titulo: 'Sonata para Violino',   compositor: 'Lucas Ferreira',   genero: 'classico', likes: 98,  clef: '𝄞' },
  { id: 5, titulo: 'Improviso nº 7',        compositor: 'Fernanda Lima',    genero: 'jazz',    likes: 156, clef: '𝄢' },
  { id: 6, titulo: 'Ciclo das Águas',       compositor: 'Paulo Mendes',     genero: 'contemporaneo', likes: 74, clef: '𝄞' },
  { id: 7, titulo: 'Valsa dos Ventos',      compositor: 'Carla Duarte',     genero: 'popular', likes: 421, clef: '𝄞' },
  { id: 8, titulo: 'Chorinho de Domingo',   compositor: 'Tiago Barbosa',    genero: 'popular', likes: 289, clef: '𝄞' },
  { id: 9, titulo: 'Elegia Moderna',        compositor: 'Sofia Ramos',      genero: 'contemporaneo', likes: 63, clef: '𝄢' },
];
 
const generoNomes = {
  classico: 'Clássico',
  jazz: 'Jazz',
  mpb: 'MPB',
  popular: 'Popular',
  contemporaneo: 'Contemporâneo',
};
 
let filtroAtivo = 'todos';
let partiturasVisiveis = 6;
 
/* ── Renderiza os cards ── */
function renderCards() {
  const grid = $('#cardsGrid');
  grid.innerHTML = '';
 
  const filtradas = filtroAtivo === 'todos'
    ? partiturasMock
    : partiturasMock.filter(p => p.genero === filtroAtivo);
 
  const exibir = filtradas.slice(0, partiturasVisiveis);
 
  if (exibir.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1;padding:3rem;">Nenhuma partitura encontrada.</p>';
    return;
  }
 
  exibir.forEach((p, i) => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.style.animationDelay = (i * 0.07) + 's';
    card.dataset.id = p.id;
    card.innerHTML = `
      <div class="card__thumb">
        <div class="card__thumb-staff">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
        <span class="card__clef">${p.clef}</span>
      </div>
      <div class="card__body">
        <p class="card__genre">${generoNomes[p.genero] || p.genero}</p>
        <h3 class="card__title">${p.titulo}</h3>
        <p class="card__composer">${p.compositor}</p>
      </div>
      <div class="card__footer">
        <span class="card__likes">♥ ${p.likes}</span>
        <button class="card__dl-btn" data-id="${p.id}">Baixar</button>
      </div>
    `;
    grid.appendChild(card);
  });
 
  // Botão "ver mais"
  const btnVerMais = $('#btnVerMais');
  btnVerMais.style.display = filtradas.length > partiturasVisiveis ? '' : 'none';
}
 
renderCards();
 
/* ── Filtros ── */
$$('.filtro').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.filtro').forEach(b => b.classList.remove('filtro--active'));
    btn.classList.add('filtro--active');
    filtroAtivo = btn.dataset.genre;
    partiturasVisiveis = 6;
    renderCards();
  });
});
 
/* ── Ver mais ── */
$('#btnVerMais').addEventListener('click', () => {
  partiturasVisiveis += 3;
  renderCards();
});
 
/* ── Download (simulado) ── */
$('#cardsGrid').addEventListener('click', e => {
  if (e.target.classList.contains('card__dl-btn')) {
    const id = e.target.dataset.id;
    const p = partiturasMock.find(x => x.id == id);
    if (p) showToast(`Download iniciado: "${p.titulo}"`);
  }
});
 
/* ============================================================
   6. EDITOR — CANVAS (com regra de tempo + áudio)
   ============================================================ */
const canvas = $('#staffCanvas');
const ctx = canvas.getContext('2d');
 
let toolAtivo = 'semibreve';
let acidenteAtivo = null;
 
// notasCanvas agora guarda apenas TIPO, ACIDENTE e ALTURA (pitchOffset).
// A posição X é sempre recalculada a partir da duração de cada figura
// (calcularLayoutNotas), o que permite aplicar a regra de tempo e
// tocar as notas na ordem certa.
let notasCanvas = []; // { tipo, acidente, pitchOffset }
 
const STAFF_TOP = 50;
const STAFF_BOTTOM = 170;
const STEP = 15; // px por grau da escala (linha ou espaço)
 
const simbolosNota = {
  semibreve: '𝅝',
  minima:    '𝅗𝅥',
  seminima:  '♩',
  colcheia:  '♪',
  pausa:     '𝄽',
};
 
/* ── Regra de tempo (compasso) ──
   Cada figura vale um número de "tempos" (unidade = semínima).
   pausa é tratada como pausa de semínima (1 tempo). */
const duracaoMap = DURATIONS;
 
const compassosDisponiveis = {
  '2/4': { numerador: 2, denominador: 4 },
  '3/4': { numerador: 3, denominador: 4 },
  '4/4': { numerador: 4, denominador: 4 },
  '6/8': { numerador: 6, denominador: 8 },
};
 
let compassoAtual = compassosDisponiveis['4/4'];
let beatsCompassoAtual = 0;
let claveAtual = 'sol';
 
function capacidadeAtual() {
  // Capacidade do compasso convertida para "tempos de semínima"
  return compassoAtual.numerador * (4 / compassoAtual.denominador);
}
 
function recalcularBeatsAtuais() {
  const cap = capacidadeAtual();
  let acc = 0;
  notasCanvas.forEach(n => {
    acc += duracaoMap[n.tipo] || 1;
    if (acc >= cap - 1e-6) acc = 0;
  });
  beatsCompassoAtual = acc;
}
 
function atualizarContadorTempo() {
  const label = document.getElementById('contadorTempoLabel');
  if (label) {
    const cap = capacidadeAtual();
    label.textContent = `Compasso: ${beatsCompassoAtual} / ${cap} tempos`;
  }
}
 
function yFromOffset(offset) {
  return STAFF_BOTTOM - offset * STEP;
}
 
function offsetFromY(y) {
  const bruto = Math.round((STAFF_BOTTOM - y) / STEP);
  return Math.max(-6, Math.min(12, bruto));
}
 
/* ── Layout: transforma a lista de notas (sem X) em posições X
   sequenciais, respeitando a duração de cada figura e inserindo
   barras de compasso quando a capacidade do compasso é atingida ── */
function calcularLayoutNotas() {
  const xInicio = 95;
  const espacoPorBeat = 46;
  const espacoBarra = 20;
  const cap = capacidadeAtual();
 
  let x = xInicio;
  let beats = 0;
  const layout = [];
  const barras = [];
 
  notasCanvas.forEach(n => {
    const dur = duracaoMap[n.tipo] || 1;
    layout.push({ ...n, x });
    x += dur * espacoPorBeat;
    beats += dur;
    if (beats >= cap - 1e-6) {
      x += espacoBarra;
      barras.push(x - espacoBarra / 2);
      beats = 0;
    }
  });
 
  return { layout, barras, larguraTotal: x };
}
 
// Reescala o canvas
function resizeCanvas() {
  canvas.parentElement.style.overflowX = 'auto';
  drawStaff();
}
 
// Desenha o pentagrama, as barras de compasso e as notas
function drawStaff() {
  const { layout, barras, larguraTotal } = calcularLayoutNotas();
 
  const larguraMinima = canvas.parentElement.offsetWidth - (32 * 2);
  const w = Math.max(larguraMinima, larguraTotal + 40, 300);
  const h = 220;
  canvas.width = w;
  canvas.height = h;
 
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#faf8f2';
  ctx.fillRect(0, 0, w, h);
 
  // 5 linhas
  ctx.strokeStyle = '#3a2f1e';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const y = STAFF_TOP + i * ((STAFF_BOTTOM - STAFF_TOP) / 4);
    ctx.beginPath();
    ctx.moveTo(50, y);
    ctx.lineTo(w - 20, y);
    ctx.stroke();
  }
 
  // Clave selecionada
  ctx.font = '72px serif';
  ctx.fillStyle = '#3a2f1e';
  ctx.fillText(CLEF_SYMBOLS[claveAtual], 8, STAFF_BOTTOM + 16);
 
  // Barras de compasso (regra de tempo em ação)
  ctx.lineWidth = 1.5;
  barras.forEach(bx => {
    ctx.beginPath();
    ctx.moveTo(bx, STAFF_TOP);
    ctx.lineTo(bx, STAFF_BOTTOM);
    ctx.stroke();
  });
 
  // Barra final dupla
  if (layout.length > 0) {
    const xFinal = larguraTotal + 6;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(xFinal, STAFF_TOP);
    ctx.lineTo(xFinal, STAFF_BOTTOM);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(xFinal + 5, STAFF_TOP);
    ctx.lineTo(xFinal + 5, STAFF_BOTTOM);
    ctx.stroke();
  }
 
  // Notas / pausas
  layout.forEach(n => desenharNota(n));
}
 
function desenharLedger(x, offset) {
  ctx.strokeStyle = '#3a2f1e';
  ctx.lineWidth = 1;
  const linha = (o) => {
    const ly = yFromOffset(o);
    ctx.beginPath();
    ctx.moveTo(x - 12, ly);
    ctx.lineTo(x + 12, ly);
    ctx.stroke();
  };
  if (offset >= 9) {
    for (let o = 10; o <= offset; o += 2) linha(o);
  }
  if (offset <= -2) {
    for (let o = -2; o >= offset; o -= 2) linha(o);
  }
}
 
function desenharNota(n) {
  if (n.tipo === 'pausa') {
    ctx.font = '28px serif';
    ctx.fillStyle = '#1a0f00';
    ctx.fillText(simbolosNota.pausa, n.x, 95 + 8);
    return;
  }
 
  const y = yFromOffset(n.pitchOffset);
  desenharLedger(n.x, n.pitchOffset);
 
  if (n.acidente) {
    ctx.font = '16px serif';
    ctx.fillStyle = '#8a4a00';
    const acidenteSimbolos = { sustenido: '♯', bemol: '♭', natural: '♮' };
    ctx.fillText(acidenteSimbolos[n.acidente] || '', n.x - 16, y + 8);
  }
 
  ctx.font = '28px serif';
  ctx.fillStyle = '#1a0f00';
  ctx.fillText(simbolosNota[n.tipo] || '♩', n.x, y + 8);
}
 
// Clique no pentagrama define a ALTURA da próxima figura.
// A posição X é sempre calculada automaticamente (ver calcularLayoutNotas),
// o que garante que a regra de tempo do compasso seja sempre respeitada.
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleY = canvas.height / rect.height;
  const yClique = (e.clientY - rect.top) * scaleY;
 
  const dur = duracaoMap[toolAtivo] || 1;
  const cap = capacidadeAtual();
 
  if (beatsCompassoAtual + dur > cap + 1e-6) {
    const restante = cap - beatsCompassoAtual;
    showToast(`Não cabe nesse compasso (${compassoAtual.numerador}/${compassoAtual.denominador}). Restam ${restante} tempo(s) — escolha uma figura menor.`, true);
    return;
  }
 
  const offset = offsetFromY(yClique);

  playback.stop(false);
  notasCanvas.push({
    tipo: toolAtivo,
    acidente: acidenteAtivo,
    pitchOffset: offset,
  });
 
  acidenteAtivo = null;
  beatsCompassoAtual += dur;
  if (beatsCompassoAtual >= cap - 1e-6) beatsCompassoAtual = 0;
 
  atualizarContadorTempo();
  drawStaff();
});
 
// Toolbar: seleção de ferramenta
$$('.tool-btn[data-tool]').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.tool-btn[data-tool]').forEach(b => {
      const t = b.dataset.tool;
      if (!['sustenido', 'bemol', 'natural'].includes(t)) b.classList.remove('active');
    });
 
    const t = btn.dataset.tool;
    if (['sustenido', 'bemol', 'natural'].includes(t)) {
      acidenteAtivo = t;
      btn.classList.add('active');
      setTimeout(() => btn.classList.remove('active'), 2000);
      showToast(`Acidente ativo: ${t}. Clique no pentagrama para inserir a próxima nota.`);
      return;
    }
 
    toolAtivo = t;
    btn.classList.add('active');
  });
});

$$('.tool-btn[data-clef]').forEach(btn => {
  btn.addEventListener('click', () => {
    playback.stop(false);
    claveAtual = btn.dataset.clef;
    $$('.tool-btn[data-clef]').forEach(clefButton => {
      clefButton.classList.toggle('active', clefButton === btn);
    });
    drawStaff();
  });
});
 
// Desfazer
$('#btnDesfazer').addEventListener('click', () => {
  playback.stop(false);
  notasCanvas.pop();
  recalcularBeatsAtuais();
  atualizarContadorTempo();
  drawStaff();
  showToast('Última nota removida.');
});
 
// Limpar
$('#btnLimpar').addEventListener('click', () => {
  if (notasCanvas.length === 0) return;
  if (confirm('Limpar todas as notas do pentagrama?')) {
    playback.stop(false);
    notasCanvas = [];
    beatsCompassoAtual = 0;
    atualizarContadorTempo();
    drawStaff();
    showToast('Pentagrama limpo.');
  }
});
 
// Inicializa canvas
window.addEventListener('resize', resizeCanvas);
setTimeout(resizeCanvas, 100);
 
/* ── Ações do editor ── */
$('#btnPublicar').addEventListener('click', () => {
  const titulo = $('#tituloPartitura').value.trim();
  if (!titulo) {
    showToast('Por favor, insira um título para a partitura.', true);
    $('#tituloPartitura').focus();
    return;
  }
  $('#modalPublicar').classList.add('open');
});
 
$('#btnPreview').addEventListener('click', () => {
  showToast('Pré-visualização em tela cheia em breve!');
});
 
$('#btnExportar').addEventListener('click', () => {
  showToast('Exportação para PDF disponível na versão final do TCC.');
});
 
/* ── CTA Hero ── */
$('#btnCriarHero').addEventListener('click', () => {
  document.querySelector('#criar').scrollIntoView({ behavior: 'smooth' });
});
 
$('#btnExplorarHero').addEventListener('click', () => {
  document.querySelector('#explorar').scrollIntoView({ behavior: 'smooth' });
});
 
/* ============================================================
   6.1 ÁUDIO — reproduz as notas do pentagrama como piano
   ============================================================ */
const playback = initializePlayback({
  cursor: $('#staffPlaybackCursor'),
  timeLabel: $('#playbackTime'),
  meterSelect: $('#compassoSelect'),
  bpmInput: $('#bpmRange'),
  getNotes: () => notasCanvas,
  getClef: () => claveAtual,
  showToast,
});

$('#compassoSelect').addEventListener('change', (e) => {
  const novo = compassosDisponiveis[e.target.value];
 
  if (notasCanvas.length > 0) {
    const ok = confirm('Trocar o compasso vai limpar as notas já inseridas nesta versão do editor. Deseja continuar?');
    if (!ok) {
      e.target.value = `${compassoAtual.numerador}/${compassoAtual.denominador}`;
      return;
    }
  }
 
  playback.stop(false);
  compassoAtual = novo;
  notasCanvas = [];
  beatsCompassoAtual = 0;
  atualizarContadorTempo();
  drawStaff();
  showToast(`Compasso alterado para ${e.target.value}.`);
});
 
$('#bpmRange').addEventListener('input', (e) => {
  $('#bpmLabel').textContent = e.target.value;
});
 
$('#btnOuvir').addEventListener('click', playback.play);
$('#btnPararSom').addEventListener('click', () => playback.stop());
 
// Estado inicial do contador de tempo
atualizarContadorTempo();
 
/* ============================================================
   7. MODAL PUBLICAR
   ============================================================ */
$('#modalClose').addEventListener('click', fecharModal);
$('#modalOverlay').addEventListener('click', fecharModal);
 
function fecharModal() {
  $('#modalPublicar').classList.remove('open');
}
 
$('#btnConfirmarPublicar').addEventListener('click', () => {
  fecharModal();
 
  const titulo = $('#tituloPartitura').value.trim() || 'Nova Partitura';
  const compositor = $('#compositorPartitura').value.trim() || 'Anônimo';
  const genero = $('#generoPublicar').value.toLowerCase().replace('â', 'a').replace('ê', 'e');
 
  // Adiciona ao mock
  const nova = {
    id: Date.now(),
    titulo,
    compositor,
    genero: genero.toLowerCase().includes('jazz') ? 'jazz'
          : genero.toLowerCase().includes('cl')   ? 'classico'
          : genero.toLowerCase().includes('mpb')  ? 'mpb'
          : genero.toLowerCase().includes('pop')  ? 'popular'
          : 'contemporaneo',
    likes: 0,
    clef: CLEF_SYMBOLS[claveAtual],
  };
 
  partiturasMock.unshift(nova);
 
  // Volta o filtro para todos e rerenderiza
  filtroAtivo = 'todos';
  $$('.filtro').forEach(b => b.classList.remove('filtro--active'));
  $('.filtro[data-genre="todos"]').classList.add('filtro--active');
  partiturasVisiveis = 6;
  renderCards();
 
  // Rola até o acervo
  document.querySelector('#explorar').scrollIntoView({ behavior: 'smooth' });
 
  showToast(`🎼 "${titulo}" publicada com sucesso!`);
 
  // Limpa editor
  playback.stop(false);
  notasCanvas = [];
  beatsCompassoAtual = 0;
  atualizarContadorTempo();
  drawStaff();
  $('#tituloPartitura').value = '';
  $('#compositorPartitura').value = '';
});
 
/* ============================================================
   8. FORMULÁRIO DE CONTATO
   ============================================================ */
$('#btnEnviar').addEventListener('click', () => {
  const nome = $('#nome').value.trim();
  const email = $('#email').value.trim();
  const mensagem = $('#mensagem').value.trim();
 
  if (!nome || !email || !mensagem) {
    showToast('Preencha todos os campos obrigatórios.', true);
    return;
  }
 
  if (!email.includes('@') || !email.includes('.')) {
    showToast('Insira um e-mail válido.', true);
    return;
  }
 
  showToast(`✉️ Mensagem enviada com sucesso, ${nome}!`);
  $('#nome').value = '';
  $('#email').value = '';
  $('#assunto').value = '';
  $('#mensagem').value = '';
});

const feedbackForm = $('#feedbackForm');
const feedbackStars = $$('.star-btn');
let feedbackRating = 3;

feedbackStars.forEach(star => {
  star.addEventListener('click', () => {
    feedbackRating = Number(star.dataset.value);
    feedbackStars.forEach(item => {
      const itemValue = Number(item.dataset.value);
      item.classList.toggle('active', itemValue <= feedbackRating);
    });
  });
});

if (feedbackForm) {
  feedbackForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const mensagem = $('#feedbackMensagem').value.trim();

    if (!mensagem) {
      showToast('Escreva um comentário antes de enviar o feedback.', true);
      return;
    }

    showToast(`💬 Feedback enviado com nota ${feedbackRating}/5. Obrigado!`);
    $('#feedbackMensagem').value = '';
    feedbackRating = 3;
    feedbackStars.forEach((item, index) => {
      item.classList.toggle('active', index < 3);
    });
  });
}
 
/* ============================================================
   9. AUTENTICAÇÃO — login, cadastro e sessão
   ============================================================ */
const authModal = $('#modalAuth');
const authForm = $('#authForm');
const authNameGroup = $('#authNameGroup');
const authModalTitle = $('#authModalTitle');
const authModalLabel = $('#authModalLabel');
const authModalMessage = $('#authModalMessage');
const authSubmit = $('#authSubmit');
const authSwitch = $('#authSwitch');
const authError = $('#authError');
let authMode = 'login';

function setAuthMode(mode) {
  authMode = mode;
  const isRegister = mode === 'register';
  authNameGroup.hidden = !isRegister;
  $('#authName').required = isRegister;
  $('#authPassword').autocomplete = isRegister ? 'new-password' : 'current-password';
  authModalLabel.textContent = isRegister ? 'Nova conta' : 'Acesso';
  authModalTitle.textContent = isRegister ? 'Criar sua conta' : 'Entrar na sua conta';
  authModalMessage.textContent = isRegister
    ? 'Cadastre-se para publicar e guardar suas partituras.'
    : 'Acesse suas partituras e continue criando.';
  authSubmit.textContent = isRegister ? 'Criar conta' : 'Entrar';
  authSwitch.textContent = isRegister ? 'Já tenho uma conta' : 'Ainda não tenho uma conta';
  authError.textContent = '';
}

function abrirAuth(mode = 'login') {
  setAuthMode(mode);
  authModal.classList.add('open');
  const firstInput = mode === 'register' ? $('#authName') : $('#authEmail');
  setTimeout(() => firstInput.focus(), 0);
}

function fecharAuth() {
  authModal.classList.remove('open');
  authForm.reset();
  authError.textContent = '';
}

function atualizarCabecalho(usuario) {
  $('#btnLogin').textContent = usuario ? usuario.nome : 'Entrar';
  $('#btnCadastro').textContent = usuario ? 'Sair' : 'Cadastrar';
}

function salvarSessao(data) {
  localStorage.setItem('partitura_token', data.token);
  localStorage.setItem('partitura_usuario', JSON.stringify(data.usuario));
  atualizarCabecalho(data.usuario);
}

function usuarioSalvo() {
  try { return JSON.parse(localStorage.getItem('partitura_usuario')); } catch (_) { return null; }
}

$('#btnLogin').addEventListener('click', () => {
  const usuario = usuarioSalvo();
  if (usuario) return showToast(`Você está conectado como ${usuario.nome}.`);
  abrirAuth('login');
});

$('#btnCadastro').addEventListener('click', () => {
  if (usuarioSalvo()) {
    localStorage.removeItem('partitura_token');
    localStorage.removeItem('partitura_usuario');
    atualizarCabecalho(null);
    return showToast('Você saiu da sua conta.');
  }
  abrirAuth('register');
});

authSwitch.addEventListener('click', () => setAuthMode(authMode === 'login' ? 'register' : 'login'));
$('#authModalClose').addEventListener('click', fecharAuth);
$('#authModalOverlay').addEventListener('click', fecharAuth);

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  authError.textContent = '';
  authSubmit.disabled = true;
  authSubmit.textContent = 'Aguarde...';
  const body = { email: $('#authEmail').value.trim(), senha: $('#authPassword').value };
  if (authMode === 'register') body.nome = $('#authName').value.trim();
  try {
    const response = await fetch(`/api/auth/${authMode === 'register' ? 'registro' : 'login'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.erro || 'Não foi possível concluir a operação.');
    salvarSessao(data);
    fecharAuth();
    showToast(authMode === 'register' ? `Conta criada. Bem-vindo, ${data.usuario.nome}!` : `Bem-vindo de volta, ${data.usuario.nome}!`);
  } catch (error) {
    authError.textContent = error.message;
    authSubmit.textContent = authMode === 'register' ? 'Criar conta' : 'Entrar';
  } finally {
    authSubmit.disabled = false;
  }
});

atualizarCabecalho(usuarioSalvo());
 
/* ============================================================
   11. PREVIEW ANIMADO — seção Sobre
   ============================================================ */
const scoreDisplay = $('#scoreNotesDisplay');
const notesList = ['♩', '♪', '♫', '♬'];
 
let noteIndex = 0;
function addAnimatedNote() {
  if (!scoreDisplay) return;
  const span = document.createElement('span');
  span.textContent = notesList[noteIndex % notesList.length];
  span.style.cssText = `
    font-size: 1.8rem;
    color: #3a2f1e;
    opacity: 0;
    animation: fadeUp 2.5s ease forwards;
  `;
  scoreDisplay.appendChild(span);
  noteIndex++;
  if (scoreDisplay.children.length > 6) {
    scoreDisplay.removeChild(scoreDisplay.firstChild);
  }
}
 
setInterval(addAnimatedNote, 900);
 
/* ============================================================
   12. INTERSECTION OBSERVER — animações de entrada
   ============================================================ */
const observerOptions = { threshold: 0.12 };
 
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);
 
$$('.step, .form-card, .about-text, .about-visual, .score-preview').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
});
 
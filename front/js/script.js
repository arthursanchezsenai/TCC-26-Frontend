/* ============================================================
   PARTITURA — script.js
   Módulos: Loader | Header | Hero | Cards | Editor Canvas
            (com regra de tempo + reprodução de áudio) |
            Stats | Filtros | Modal | Formulário | Toast
   ============================================================ */
 
'use strict';
 
/* ── Utilitários ── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
 
/* ============================================================
   1. LOADER
   ============================================================ */
window.addEventListener('load', () => {
  const loader = $('#loader');
  setTimeout(() => loader.classList.add('hidden'), 1200);
});
 
/* ============================================================
   2. HEADER — scroll + hamburger
   ============================================================ */
const header = $('#header');
const hamburger = $('#hamburger');
const nav = $('#nav');
 
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
});
 
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  nav.classList.toggle('open');
});
 
// Fecha o nav ao clicar em um link
$$('.nav__link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    nav.classList.remove('open');
  });
});
 
/* ============================================================
   3. HERO — notas flutuantes
   ============================================================ */
const heroNotes = $('#heroNotes');
const noteSymbols = ['♩', '♪', '♫', '♬', '𝄞', '𝄢', '♭', '♯'];
 
function createNote() {
  const el = document.createElement('span');
  el.classList.add('floating-note');
  el.textContent = noteSymbols[Math.floor(Math.random() * noteSymbols.length)];
  el.style.left = Math.random() * 100 + '%';
  el.style.top = Math.random() * 80 + 20 + '%';
  const duration = 6 + Math.random() * 6;
  const delay = Math.random() * 4;
  el.style.animationDuration = duration + 's';
  el.style.animationDelay = delay + 's';
  el.style.fontSize = (1.2 + Math.random() * 1.5) + 'rem';
  heroNotes.appendChild(el);
  setTimeout(() => el.remove(), (duration + delay) * 1000 + 200);
}
 
setInterval(createNote, 700);
 
/* ============================================================
   4. CONTADOR DE ESTATÍSTICAS (scroll trigger)
   ============================================================ */
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1800;
  const step = 16;
  const steps = Math.floor(duration / step);
  let current = 0;
  const increment = target / steps;
 
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      el.textContent = target.toLocaleString('pt-BR');
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(current).toLocaleString('pt-BR');
    }
  }, step);
}
 
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
 
$$('.stat__number').forEach(el => statsObserver.observe(el));
 
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
const duracaoMap = {
  semibreve: 4,
  minima: 2,
  seminima: 1,
  colcheia: 0.5,
  pausa: 1,
};
 
const compassosDisponiveis = {
  '2/4': { numerador: 2, denominador: 4 },
  '3/4': { numerador: 3, denominador: 4 },
  '4/4': { numerador: 4, denominador: 4 },
  '6/8': { numerador: 6, denominador: 8 },
};
 
let compassoAtual = compassosDisponiveis['4/4'];
let beatsCompassoAtual = 0;
 
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
 
/* ── Tabela de alturas (posição no pentagrama → nota real) ──
   offset 0 = E4 (linha de baixo da clave de Sol). Cada passo de
   15px equivale a um grau diatônico (linha ou espaço). */
const pitchTable = {
  '-6': { nome: 'F3', midi: 53 },
  '-5': { nome: 'G3', midi: 55 },
  '-4': { nome: 'A3', midi: 57 },
  '-3': { nome: 'B3', midi: 59 },
  '-2': { nome: 'C4', midi: 60 },
  '-1': { nome: 'D4', midi: 62 },
  '0':  { nome: 'E4', midi: 64 },
  '1':  { nome: 'F4', midi: 65 },
  '2':  { nome: 'G4', midi: 67 },
  '3':  { nome: 'A4', midi: 69 },
  '4':  { nome: 'B4', midi: 71 },
  '5':  { nome: 'C5', midi: 72 },
  '6':  { nome: 'D5', midi: 74 },
  '7':  { nome: 'E5', midi: 76 },
  '8':  { nome: 'F5', midi: 77 },
  '9':  { nome: 'G5', midi: 79 },
  '10': { nome: 'A5', midi: 81 },
  '11': { nome: 'B5', midi: 83 },
  '12': { nome: 'C6', midi: 84 },
};
 
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
 
  // Clave de Sol
  ctx.font = '72px serif';
  ctx.fillStyle = '#3a2f1e';
  ctx.fillText('𝄞', 8, STAFF_BOTTOM + 16);
 
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
 
// Desfazer
$('#btnDesfazer').addEventListener('click', () => {
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
let audioCtx = null;
let osciladoresAtivos = [];
let masterGainAtivo = null;
let bpmAtual = 100;
 
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
 
function midiParaFrequencia(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}
 
// Timbre simplificado de piano: fundamental + harmônicos com
// envelope de ataque rápido e decaimento exponencial (estilo "corda dedilhada").
function tocarNota(freq, startTime, duracaoSeg, ctxAudio, masterGain) {
  const parciais = [
    { mult: 1, ganho: 0.6 },
    { mult: 2, ganho: 0.25 },
    { mult: 3, ganho: 0.1 },
    { mult: 4, ganho: 0.05 },
  ];
 
  parciais.forEach(p => {
    const osc = ctxAudio.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq * p.mult;
 
    const gain = ctxAudio.createGain();
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(p.ganho, startTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duracaoSeg * 0.95);
 
    osc.connect(gain).connect(masterGain);
    osc.start(startTime);
    osc.stop(startTime + duracaoSeg + 0.05);
 
    osciladoresAtivos.push(osc);
  });
}
 
function tocarPartitura() {
  if (notasCanvas.length === 0) {
    showToast('Adicione notas ao pentagrama antes de ouvir.', true);
    return;
  }
 
  const ctxAudio = getAudioCtx();
  if (ctxAudio.state === 'suspended') ctxAudio.resume();
 
  const masterGain = ctxAudio.createGain();
  masterGain.gain.value = 0.35;
  masterGain.connect(ctxAudio.destination);
  masterGainAtivo = masterGain;
  osciladoresAtivos = [];
 
  const segundosPorTempo = 60 / bpmAtual;
  let tempoAtual = ctxAudio.currentTime + 0.1;
 
  notasCanvas.forEach(n => {
    const duracaoSeg = (duracaoMap[n.tipo] || 1) * segundosPorTempo;
 
    if (n.tipo !== 'pausa') {
      let midi = pitchTable[String(n.pitchOffset)].midi;
      if (n.acidente === 'sustenido') midi += 1;
      if (n.acidente === 'bemol') midi -= 1;
      const freq = midiParaFrequencia(midi);
      tocarNota(freq, tempoAtual, duracaoSeg, ctxAudio, masterGain);
    }
 
    tempoAtual += duracaoSeg;
  });
 
  showToast('🎹 Reproduzindo partitura...');
}
 
function pararPartitura() {
  osciladoresAtivos.forEach(osc => {
    try { osc.stop(); } catch (e) { /* já parado */ }
  });
  osciladoresAtivos = [];
  if (masterGainAtivo) {
    try { masterGainAtivo.disconnect(); } catch (e) { /* já desconectado */ }
  }
  showToast('Reprodução interrompida.');
}
 
/* ── Painel de compasso / andamento / áudio (injetado via JS) ── */
const painelExtra = document.createElement('div');
painelExtra.id = 'painelRegrasTempo';
painelExtra.style.cssText = `
  display:flex; flex-wrap:wrap; align-items:center; gap:1.25rem;
  margin-top:1rem; padding:1rem 1.25rem;
  background: var(--bg-alt, #faf8f2);
  border: 1px solid var(--border, #d8cdb8);
  border-radius: 10px;
  font-size: 0.9rem;
  color: var(--text, #1a0f00);
`;
painelExtra.innerHTML = `
  <label style="display:flex;align-items:center;gap:.5rem;">
    Compasso:
    <select id="compassoSelect" style="padding:.35rem .5rem;border-radius:6px;border:1px solid var(--border,#d8cdb8);background:#fff;">
      <option value="2/4">2/4</option>
      <option value="3/4">3/4</option>
      <option value="4/4" selected>4/4</option>
      <option value="6/8">6/8</option>
    </select>
  </label>
  <span id="contadorTempoLabel" style="color:var(--text-muted,#6b6152);"></span>
  <label style="display:flex;align-items:center;gap:.5rem;">
    Andamento: <span id="bpmLabel">100</span> BPM
    <input id="bpmRange" type="range" min="40" max="200" value="100" style="width:120px;">
  </label>
  <button id="btnOuvir" type="button" style="background:var(--gold,#c9a227);color:#1a0f00;font-weight:600;border:none;padding:.5rem 1rem;border-radius:6px;cursor:pointer;">🎹 Ouvir partitura</button>
  <button id="btnPararSom" type="button" style="background:transparent;color:var(--text,#1a0f00);border:1px solid var(--border,#d8cdb8);padding:.5rem 1rem;border-radius:6px;cursor:pointer;">⏹ Parar</button>
`;
canvas.insertAdjacentElement('afterend', painelExtra);
 
$('#compassoSelect').addEventListener('change', (e) => {
  const novo = compassosDisponiveis[e.target.value];
 
  if (notasCanvas.length > 0) {
    const ok = confirm('Trocar o compasso vai limpar as notas já inseridas nesta versão do editor. Deseja continuar?');
    if (!ok) {
      e.target.value = `${compassoAtual.numerador}/${compassoAtual.denominador}`;
      return;
    }
  }
 
  compassoAtual = novo;
  notasCanvas = [];
  beatsCompassoAtual = 0;
  atualizarContadorTempo();
  drawStaff();
  showToast(`Compasso alterado para ${e.target.value}.`);
});
 
$('#bpmRange').addEventListener('input', (e) => {
  bpmAtual = parseInt(e.target.value, 10);
  $('#bpmLabel').textContent = bpmAtual;
});
 
$('#btnOuvir').addEventListener('click', tocarPartitura);
$('#btnPararSom').addEventListener('click', pararPartitura);
 
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
    clef: '𝄞',
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
   10. TOAST
   ============================================================ */
let toastTimer;
 
function showToast(msg, isError = false) {
  const toast = $('#toast');
  toast.textContent = msg;
  toast.style.borderColor = isError ? '#c94c4c' : 'var(--gold)';
  toast.style.color = isError ? '#e8c0c0' : 'var(--text)';
  toast.classList.add('show');
 
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}
 
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
 
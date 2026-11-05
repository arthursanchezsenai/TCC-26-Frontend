import { DURATIONS, staffOffsetToMidi } from './music-theory.js';

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export function initializePlayback({
  cursor,
  timeLabel,
  meterSelect,
  bpmInput,
  getNotes,
  getClef,
  showToast,
}) {
  let audioContext = null;
  let activeOscillators = [];
  let activeGain = null;
  let animationFrame = null;
  let isPlaying = false;
  let playbackRequest = 0;

  function getAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('Este navegador não oferece suporte à reprodução de áudio.');
    }
    if (!audioContext) audioContext = new AudioContextClass();
    return audioContext;
  }

  function positionCursor(elapsed, secondsPerBeat, notes, beatsPerMeasure) {
    let x = 95;
    let beatInMeasure = 0;
    let elapsedBeats = elapsed / secondsPerBeat;

    for (const note of notes) {
      const duration = DURATIONS[note.tipo] || 1;
      if (elapsedBeats <= duration) {
        const progress = Math.max(0, Math.min(1, elapsedBeats / duration));
        cursor.style.left = `${x + duration * 46 * progress}px`;
        return;
      }

      elapsedBeats -= duration;
      x += duration * 46;
      beatInMeasure += duration;
      if (beatInMeasure >= beatsPerMeasure - 1e-6) {
        x += 20;
        beatInMeasure = 0;
      }
    }

    cursor.style.left = `${x}px`;
  }

  function updatePlayback(elapsed, totalDuration, notes, secondsPerBeat, beatsPerMeasure) {
    timeLabel.textContent = `${formatTime(elapsed)} / ${formatTime(totalDuration)}`;
    positionCursor(elapsed, secondsPerBeat, notes, beatsPerMeasure);
  }

  function releaseAudio(stopOscillators) {
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    if (stopOscillators) {
      activeOscillators.forEach((oscillator) => {
        try {
          oscillator.stop();
        } catch (error) {
          if (error.name !== 'InvalidStateError') throw error;
        }
      });
    }
    activeOscillators = [];
    if (activeGain) {
      activeGain.disconnect();
      activeGain = null;
    }
    isPlaying = false;
    cursor.classList.remove('is-visible');
  }

  async function play() {
    const notes = getNotes();
    if (notes.length === 0) {
      showToast('Adicione notas ao pentagrama antes de ouvir.', true);
      return;
    }

    stop(false);
    const request = ++playbackRequest;
    let context;
    try {
      context = getAudioContext();
      if (context.state === 'suspended') await context.resume();
    } catch (error) {
      if (request === playbackRequest) {
        showToast(error.message || 'Não foi possível iniciar o áudio.', true);
      }
      return;
    }
    if (request !== playbackRequest) return;

    const bpm = Number(bpmInput.value);
    const secondsPerBeat = 60 / bpm;
    const [numerator, denominator] = meterSelect.value.split('/').map(Number);
    const beatsPerMeasure = numerator * (4 / denominator);
    const totalDuration = notes.reduce((total, note) => (
      total + (DURATIONS[note.tipo] || 1) * secondsPerBeat
    ), 0);
    const gain = context.createGain();
    gain.gain.value = 0.35;
    gain.connect(context.destination);
    activeGain = gain;
    activeOscillators = [];

    const startTime = context.currentTime + 0.1;
    let scheduledTime = startTime;
    for (const note of notes) {
      const duration = (DURATIONS[note.tipo] || 1) * secondsPerBeat;
      if (note.tipo !== 'pausa') {
        const frequency = 440 * Math.pow(
          2,
          (staffOffsetToMidi(note.pitchOffset, getClef(), note.acidente) - 69) / 12,
        );
        [
          { multiplier: 1, level: 0.6 },
          { multiplier: 2, level: 0.25 },
          { multiplier: 3, level: 0.1 },
          { multiplier: 4, level: 0.05 },
        ].forEach(({ multiplier, level }) => {
          const oscillator = context.createOscillator();
          const envelope = context.createGain();
          oscillator.type = 'sine';
          oscillator.frequency.value = frequency * multiplier;
          envelope.gain.setValueAtTime(0.0001, scheduledTime);
          envelope.gain.linearRampToValueAtTime(level, scheduledTime + 0.008);
          envelope.gain.exponentialRampToValueAtTime(0.0001, scheduledTime + duration * 0.95);
          oscillator.connect(envelope).connect(gain);
          oscillator.start(scheduledTime);
          oscillator.stop(scheduledTime + duration + 0.05);
          activeOscillators.push(oscillator);
        });
      }
      scheduledTime += duration;
    }

    isPlaying = true;
    cursor.classList.add('is-visible');
    showToast('🎹 Reproduzindo partitura...');

    const animate = () => {
      if (!isPlaying) return;
      const elapsed = Math.min(totalDuration, Math.max(0, context.currentTime - startTime));
      updatePlayback(elapsed, totalDuration, notes, secondsPerBeat, beatsPerMeasure);
      if (elapsed >= totalDuration) {
        timeLabel.textContent = `${formatTime(totalDuration)} / ${formatTime(totalDuration)}`;
        releaseAudio(false);
        return;
      }
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
  }

  function stop(notify = true) {
    const wasPlaying = isPlaying;
    playbackRequest += 1;
    releaseAudio(true);
    timeLabel.textContent = '00:00 / 00:00';
    if (notify && wasPlaying) showToast('Reprodução interrompida.');
  }

  return { play, stop };
}

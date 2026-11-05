export const DURATIONS = {
  semibreve: 4,
  minima: 2,
  seminima: 1,
  colcheia: 0.5,
  pausa: 1,
};

export const CLEF_SYMBOLS = {
  sol: '𝄞',
  fa: '𝄢',
  do: '𝄡',
};

const CLEF_BOTTOM_NOTES = {
  sol: { letter: 'E', octave: 4 },
  fa: { letter: 'G', octave: 2 },
  do: { letter: 'F', octave: 3 },
};

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURAL_SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function staffOffsetToMidi(offset, clef, accidental = null) {
  const bottomNote = CLEF_BOTTOM_NOTES[clef];
  if (!bottomNote || !Number.isInteger(offset)) {
    throw new RangeError('Altura ou clave musical inválida.');
  }

  const bottomIndex = LETTERS.indexOf(bottomNote.letter);
  const diatonicIndex = bottomIndex + offset;
  const octave = bottomNote.octave + Math.floor(diatonicIndex / LETTERS.length);
  const letter = LETTERS[(diatonicIndex % LETTERS.length + LETTERS.length) % LETTERS.length];
  const semitone = accidental === 'sustenido' ? 1 : accidental === 'bemol' ? -1 : 0;

  return (octave + 1) * 12 + NATURAL_SEMITONES[letter] + semitone;
}

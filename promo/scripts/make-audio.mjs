// Synthesises the promo's soundtrack and sound effects from scratch (no samples, so no licensing). Pure Node.
// Music: a warm lo-fi loop at 90 BPM, so one bar is exactly 80 video frames at 30 fps and scene cuts land on the grid.
// Run: node scripts/make-audio.mjs  ->  public/audio/*.wav
import fs from "node:fs";

const SR = 44100;
const OUT = new URL("../public/audio/", import.meta.url);
fs.mkdirSync(OUT, { recursive: true });

const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
let seed = 7;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647; // deterministic, so renders repeat
const noise = () => rand() * 2 - 1;
const TAU = Math.PI * 2;

/** Chamberlin state-variable filter; `damp` is 1/Q. */
const svf = () => {
  let low = 0, band = 0;
  return (x, fc, damp = 0.7) => {
    const f = 2 * Math.sin((Math.PI * Math.min(fc, SR / 6)) / SR);
    low += f * band;
    const high = x - low - damp * band;
    band += f * high;
    return { low, band, high };
  };
};

const stereo = (sec) => [new Float32Array(Math.ceil(sec * SR)), new Float32Array(Math.ceil(sec * SR))];
const add = (buf, i, v, pan = 0) => {
  if (i < 0 || i >= buf[0].length) return;
  buf[0][i] += v * Math.cos(((pan + 1) * Math.PI) / 4);
  buf[1][i] += v * Math.sin(((pan + 1) * Math.PI) / 4);
};
const rms = (b) => { let s = 0, n = 0; for (const ch of b) for (const v of ch) { s += v * v; n++; } return Math.sqrt(s / n); };

/** Freeverb-style room: parallel damped combs into allpasses, slightly different per channel. */
function reverb(mono, wetToDry = 0.4) {
  const combs = [1557, 1617, 1491, 1422, 1277, 1356];
  const aps = [556, 441, 341];
  const out = [new Float32Array(mono.length), new Float32Array(mono.length)];
  for (let ch = 0; ch < 2; ch++) {
    const cb = combs.map((d) => ({ buf: new Float32Array(d + ch * 23), i: 0, f: 0 }));
    const ab = aps.map((d) => ({ buf: new Float32Array(d + ch * 23), i: 0 }));
    for (let n = 0; n < mono.length; n++) {
      const x = mono[n] * 0.015;
      let s = 0;
      for (const c of cb) { const y = c.buf[c.i]; c.f = y * 0.7 + c.f * 0.3; c.buf[c.i] = x + c.f * 0.86; c.i = (c.i + 1) % c.buf.length; s += y; }
      for (const a of ab) { const b = a.buf[a.i]; const y = -s + b; a.buf[a.i] = s + b * 0.5; a.i = (a.i + 1) % a.buf.length; s = y; }
      out[ch][n] = s;
    }
  }
  let dry = 0, wet = 0;
  for (let n = 0; n < mono.length; n++) { dry += mono[n] ** 2; wet += out[0][n] ** 2; }
  const g = wet > 0 ? (wetToDry * Math.sqrt(dry)) / Math.sqrt(wet) : 0;
  for (const ch of out) for (let n = 0; n < ch.length; n++) ch[n] *= g;
  return out;
}

function writeWav(name, [L, R], peakTo = 0.89) {
  let peak = 0;
  for (let i = 0; i < L.length; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = peak > 0 ? peakTo / peak : 1;
  const n = L.length, buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), 46 + i * 4);
  }
  fs.writeFileSync(new URL(name, OUT), buf);
  console.log("wrote", name.padEnd(14), (n / SR).toFixed(2) + "s");
}

// ---- voices -------------------------------------------------------------------------------------------------------

/** Electric-piano pluck: sine body with a short bell-like attack. */
function pluck(buf, t0, m, vel, pan, len = 1.4) {
  const f = mtof(m), s0 = Math.round(t0 * SR);
  for (let i = 0; i < len * SR; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.004) * Math.exp(-t * 3.2);
    const v = Math.sin(TAU * f * t) + 0.25 * Math.sin(TAU * 2 * f * t) * Math.exp(-t * 6) + 0.08 * Math.sin(TAU * 3 * f * t) * Math.exp(-t * 10);
    add(buf, s0 + i, v * env * vel, pan);
  }
}

/** Bell: inharmonic partials with long decays. */
function bell(buf, t0, m, vel, pan) {
  const f = mtof(m), s0 = Math.round(t0 * SR);
  const parts = [[1, 1, 1.1], [2.76, 0.35, 2.4], [5.4, 0.15, 4], [2, 0.3, 1.6]];
  for (let i = 0; i < 3.2 * SR; i++) {
    const t = i / SR;
    let v = 0;
    for (const [r, a, d] of parts) v += a * Math.sin(TAU * f * r * t) * Math.exp(-t * d);
    add(buf, s0 + i, v * Math.min(1, t / 0.002) * vel, pan);
  }
}

/** Tuned pop: a short upward-bending sine blip. */
function pop(buf, t0, m, vel = 1) {
  const f = mtof(m), s0 = Math.round(t0 * SR);
  let ph = 0;
  for (let i = 0; i < 0.3 * SR; i++) {
    const t = i / SR;
    ph += (TAU * f * (0.82 + 0.18 * (1 - Math.exp(-t * 60)))) / SR;
    add(buf, s0 + i, (Math.sin(ph) + 0.2 * Math.sin(2 * ph)) * Math.min(1, t / 0.003) * Math.exp(-t * 16) * vel);
  }
}

// ---- music --------------------------------------------------------------------------------------------------------

const BEAT = 60 / 90; // 20 frames
const BAR = BEAT * 4; // 80 frames
const CH = {
  I: [48, 52, 55, 59, 62], // Cmaj9
  vi: [45, 48, 52, 55, 59], // Am9
  IV: [41, 45, 48, 52, 55], // Fmaj9
  V: [43, 47, 50, 52, 57], // G6/9
};
// [start in beats, length in beats, chord]. Bar 9 (frame 720) is where the outro lands on home.
const TIMELINE = [
  [0, 4, "I"], [4, 4, "vi"], [8, 4, "IV"], [12, 4, "V"],
  [16, 4, "I"], [20, 4, "vi"], [24, 4, "IV"], [28, 4, "V"],
  [32, 2, "IV"], [34, 2, "V"], [36, 8, "I"],
];
const LENGTH = 30; // seconds; the video is 29 s
const DRUMS = [8, 36]; // beats: bar 2 (frame 160) to bar 9 (frame 720)

function music() {
  const pad = stereo(LENGTH), keys = stereo(LENGTH), bass = stereo(LENGTH), drums = stereo(LENGTH), fx = stereo(LENGTH);

  // Pad: two detuned soft saws per note, slow swell, chords overlap so changes glide.
  for (const [b0, len, name] of TIMELINE) {
    const start = b0 * BEAT - 0.25, end = (b0 + len) * BEAT + 0.6;
    const notes = CH[name].map((m) => m + 12);
    const s0 = Math.max(0, Math.round(start * SR)), s1 = Math.min(pad[0].length, Math.round((end + 1.2) * SR));
    for (let i = s0; i < s1; i++) {
      const t = i / SR, local = t - start;
      const env = Math.min(1, local / 0.8) * (t < end ? 1 : Math.exp(-(t - end) * 3)) * (1 + 0.08 * Math.sin(TAU * 0.21 * t));
      let l = 0, r = 0;
      notes.forEach((m, n) => {
        const f = mtof(m);
        for (const [det, side] of [[0.9965, -1], [1.0035, 1]]) {
          let v = 0;
          for (let k = 1; k <= 6; k++) v += (Math.sin(TAU * f * det * k * t + n + k) / k) * Math.exp(-0.5 * (k - 1));
          l += v * (side < 0 ? 0.62 : 0.38);
          r += v * (side < 0 ? 0.38 : 0.62);
        }
      });
      pad[0][i] += l * env * 0.03;
      pad[1][i] += r * env * 0.03;
    }
  }

  // Keys: an arpeggio from bar 1, quarter notes first, eighths once the drums arrive, sparse again for the outro.
  const ARP = [0, 2, 1, 3, 2, 4, 3, 2];
  for (const [b0, len, name] of TIMELINE) {
    const notes = CH[name].map((m) => m + 24);
    for (let e = 0; e < len * 2; e++) {
      const beat = b0 + e / 2;
      if (beat < 4) continue; // the hook is pad only
      const outro = beat >= 36;
      const sparse = beat < 8 || outro;
      if (sparse && e % 2) continue;
      if (outro && beat >= 40) continue;
      const vel = (e % 2 ? 0.13 : 0.2) * (outro ? 0.8 : 1);
      pluck(keys, beat * BEAT + (e % 2 ? 0.035 : 0), notes[ARP[e % 8]], vel, e % 2 ? 0.35 : -0.35);
    }
  }

  // Bass: from bar 2, root on 1, push on the and of 2, root on 3.
  for (const [b0, len, name] of TIMELINE) {
    const root = CH[name][0] - 12;
    for (let bar = 0; bar < len; bar += 4) {
      for (const [at, dur] of [[0, 1.5], [1.5, 0.5], [2, 2]]) {
        const beat = b0 + bar + at;
        if (beat < 8 || beat >= 44 || at >= len) continue;
        const f = mtof(root), s0 = Math.round(beat * BEAT * SR), n = Math.round((dur * BEAT + (beat >= 36 ? 2 : 0)) * SR);
        for (let i = 0; i < n; i++) {
          const t = i / SR;
          const env = Math.min(1, t / 0.012) * Math.min(1, (n - i) / (0.08 * SR));
          const v = Math.sin(TAU * f * t) + 0.32 * Math.sin(TAU * 2 * f * t) + 0.08 * Math.sin(TAU * 3 * f * t);
          add(bass, s0 + i, v * env * 0.12);
        }
      }
    }
  }

  // Drums: soft kick, brushed snare, swung hats.
  const hp = svf(), bp = svf();
  for (let beat = DRUMS[0]; beat < DRUMS[1]; beat += 0.5) {
    const pos = beat % 4;
    const t0 = (beat + (pos % 1 ? 0.08 : 0)) * BEAT;
    const s0 = Math.round(t0 * SR);
    if (pos === 0 || pos === 2.5) {
      let ph = 0;
      for (let i = 0; i < 0.45 * SR; i++) {
        const t = i / SR;
        ph += (TAU * (48 + 75 * Math.exp(-t * 28))) / SR;
        add(drums, s0 + i, Math.sin(ph) * Math.exp(-t * 7.5) * 0.55);
      }
    }
    if (pos === 1 || pos === 3) {
      for (let i = 0; i < 0.3 * SR; i++) {
        const t = i / SR;
        const n = bp(noise(), 1900, 0.9).band;
        add(drums, s0 + i, (n * 0.6 + 0.4 * Math.sin(TAU * 185 * t) * Math.exp(-t * 25)) * Math.exp(-t * 15) * 0.2, 0.1);
      }
    }
    for (let i = 0; i < 0.07 * SR; i++) {
      const t = i / SR;
      add(drums, s0 + i, hp(noise(), 7500, 0.8).high * Math.exp(-t * 55) * (pos % 1 ? 0.07 : 0.045), 0.3);
    }
  }

  // A noise swell into the groove (bar 2) and a softer one into the outro (bar 9).
  const lp = svf();
  for (const [endBeat, len, gain] of [[8, 1.4, 0.16], [36, 1.6, 0.12]]) {
    const s0 = Math.round((endBeat * BEAT - len) * SR);
    for (let i = 0; i < len * SR; i++) {
      const p = i / (len * SR);
      add(fx, s0 + i, lp(noise(), 300 + 6000 * p * p, 0.6).low * p * p * gain, Math.sin(p * 3) * 0.4);
    }
  }

  // Mix: pad and keys share a room; the rhythm section stays dry and close.
  const send = new Float32Array(pad[0].length);
  for (let i = 0; i < send.length; i++) send[i] = (pad[0][i] + pad[1][i] + keys[0][i] + keys[1][i]) * 0.5;
  const room = reverb(send, 0.45);
  for (const [n, s] of Object.entries({ pad, keys, bass, drums })) console.log("  rms", n.padEnd(6), (20 * Math.log10(rms(s))).toFixed(1), "dB");

  const mix = stereo(LENGTH);
  const fadeIn = 0.5 * SR, fadeOutStart = 26.6 * SR, fadeOutLen = 2.4 * SR;
  for (let ch = 0; ch < 2; ch++) {
    for (let i = 0; i < mix[ch].length; i++) {
      const v = pad[ch][i] + keys[ch][i] + bass[ch][i] + drums[ch][i] + fx[ch][i] + room[ch][i];
      const fade = Math.min(1, i / fadeIn) * (i < fadeOutStart ? 1 : Math.max(0, 1 - (i - fadeOutStart) / fadeOutLen) ** 1.5);
      mix[ch][i] = Math.tanh(v * 1.4) * fade;
    }
  }
  writeWav("music.wav", mix);
}

// ---- sound effects ------------------------------------------------------------------------------------------------

function sfx() {
  // Whoosh: noise through a sweeping band-pass, panned across.
  {
    const b = stereo(0.9), f = svf();
    for (let i = 0; i < b[0].length; i++) {
      const p = i / b[0].length;
      const env = Math.sin(Math.PI * Math.min(1, p * 1.25)) ** 2;
      add(b, i, f(noise(), 350 + 2600 * Math.sin(Math.PI * p), 0.5).band * env * 0.5, -0.6 + 1.2 * p);
    }
    writeWav("whoosh.wav", b);
  }
  // Tap: a soft, short click.
  {
    const b = stereo(0.12), f = svf();
    for (let i = 0; i < b[0].length; i++) {
      const t = i / SR;
      add(b, i, (Math.sin(TAU * 1650 * t) * 0.6 + f(noise(), 3000, 0.7).band * 0.5) * Math.exp(-t * 90));
    }
    writeWav("tap.wav", b);
  }
  // Switch: two clicks, the second higher.
  {
    const b = stereo(0.2), f = svf();
    for (const [at, hz] of [[0, 1400], [0.035, 2300]]) {
      const s0 = Math.round(at * SR);
      for (let i = 0; i < 0.08 * SR; i++) {
        const t = i / SR;
        add(b, s0 + i, (Math.sin(TAU * hz * t) * 0.6 + f(noise(), hz * 1.6, 0.7).band * 0.4) * Math.exp(-t * 110));
      }
    }
    writeWav("switch.wav", b);
  }
  // Typing: soft key ticks with uneven spacing, 2.1 s to match the words typing in.
  {
    const b = stereo(2.2), f = svf();
    for (let t0 = 0.02; t0 < 2.05; t0 += 0.05 + rand() * 0.06) {
      const s0 = Math.round(t0 * SR), vel = 0.5 + rand() * 0.5, hz = 2200 + rand() * 1400, pan = rand() * 0.6 - 0.3;
      for (let i = 0; i < 0.03 * SR; i++) {
        const t = i / SR;
        add(b, s0 + i, (f(noise(), hz, 0.8).band * 0.7 + Math.sin(TAU * hz * 0.5 * t) * 0.25) * Math.exp(-t * 160) * vel, pan);
      }
    }
    writeWav("typing.wav", b);
  }
  // Paper: a photo landing on the page, a low thud and a brush of paper.
  {
    const b = stereo(0.5), f = svf();
    for (let i = 0; i < b[0].length; i++) {
      const t = i / SR;
      add(b, i, Math.sin(TAU * (70 + 40 * Math.exp(-t * 30)) * t) * Math.exp(-t * 14) * 0.8 + f(noise(), 1800, 0.9).low * Math.exp(-t * 11) * 0.5);
    }
    writeWav("paper.wav", b);
  }
  // Tuned pops (MIDI note in the name), so they sit inside the chord playing at that moment.
  for (const m of [72, 74, 76, 79, 81, 84]) {
    const b = stereo(0.32);
    pop(b, 0, m);
    writeWav(`pop-${m}.wav`, b);
  }
  // Shimmer: a fast rising run over A C E G (fits both Am9 and Fmaj9), for the calendar filling up.
  {
    const b = stereo(3);
    [69, 72, 76, 79, 81, 84, 88, 91, 93, 96, 100, 103].forEach((m, i) => pluck(b, i * 0.105, m, 0.6 - i * 0.025, -0.5 + i * 0.09, 1.6));
    const mono = new Float32Array(b[0].length);
    for (let i = 0; i < mono.length; i++) mono[i] = (b[0][i] + b[1][i]) / 2;
    const room = reverb(mono, 0.6);
    for (let ch = 0; ch < 2; ch++) for (let i = 0; i < mono.length; i++) b[ch][i] += room[ch][i];
    writeWav("shimmer.wav", b);
  }
  // Chime: a Cmaj9 bell arpeggio for the app icon.
  {
    const b = stereo(4.2);
    [60, 67, 71, 74, 76].forEach((m, i) => bell(b, i * 0.07, m + 12, 0.5, -0.4 + i * 0.2));
    const mono = new Float32Array(b[0].length);
    for (let i = 0; i < mono.length; i++) mono[i] = (b[0][i] + b[1][i]) / 2;
    const room = reverb(mono, 0.7);
    for (let ch = 0; ch < 2; ch++) for (let i = 0; i < mono.length; i++) b[ch][i] += room[ch][i];
    writeWav("chime.wav", b);
  }
}

music();
sfx();

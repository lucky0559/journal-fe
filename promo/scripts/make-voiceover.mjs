// Generates the promo voiceover with ElevenLabs, one clip per line, into public/voiceover/*.mp3, then levels each clip
// (gentle compression, -17 dBFS speech loudness, soft peak limit) into public/voiceover/*.wav, which the video plays.
// Run: node --env-file=.env scripts/make-voiceover.mjs           (needs ELEVENLABS_API_KEY in promo/.env)
//      node --env-file=.env scripts/make-voiceover.mjs --level   (only re-levels the existing mp3s, no API calls)
//      node --env-file=.env scripts/make-voiceover.mjs --list    (prints the voices, if the key may read them)
//      add --v2 to any of these for the v2 promo's lines (public/voiceover-v2/)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY && !process.argv.includes("--level")) throw new Error("Set ELEVENLABS_API_KEY in promo/.env");
const API = "https://api.elevenlabs.io/v1";
const V2 = process.argv.includes("--v2");
const OUT = new URL(V2 ? "../public/voiceover-v2/" : "../public/voiceover/", import.meta.url);

const VOICE_ID = process.env.VOICE_ID ?? "XrExE9yKIg1WjnnlVkGX"; // Matilda: warm, calm
const LINES_V1 = [
  ["01-hook", "At the end of the day, put it down."],
  ["02-mood", "Pick a colour for how you feel. No numbers. No scores."],
  ["03-write", "Write a few words."],
  ["04-photo", "Add a photo, or just say it out loud."],
  ["05-month", "Watch your month take colour."],
  ["06-private", "Every page is private, until you choose to share it."],
  ["07-outro", "Journal. Write a few honest lines tonight."],
];
// v2 adds Lumi, stickers and friends. "Journal" is how the name is said.
const LINES_V2 = [
  ["01-hook", "This is Lumi. At the end of the day, let's put it down."],
  ["02-mood", "Pick a colour for how you feel. No numbers. No scores."],
  ["03-write", "Write a few words."],
  ["04-photo", "Add a photo, or just say it out loud."],
  ["05-stickers", "Then make it yours, with stickers you can move anywhere."],
  ["06-month", "Watch your month take colour."],
  ["07-friends", "Every page is private, until you share it. And friends can send a hug back."],
  ["08-outro", "Journal. Write a few honest lines tonight."],
];
const LINES = V2 ? LINES_V2 : LINES_V1;

if (process.argv.includes("--list")) {
  const res = await fetch(`${API}/voices`, { headers: { "xi-api-key": KEY } });
  if (!res.ok) throw new Error(`voices: ${res.status} ${await res.text()}`);
  const { voices } = await res.json();
  for (const v of voices) console.log(v.voice_id, v.name.padEnd(22), JSON.stringify(v.labels ?? {}));
  process.exit(0);
}

fs.mkdirSync(OUT, { recursive: true });
for (const [i, [id, text]] of LINES.entries()) {
  if (process.argv.includes("--level")) break;
  const res = await fetch(`${API}/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      // Neighbouring lines keep the delivery consistent from clip to clip.
      previous_text: LINES[i - 1]?.[1],
      next_text: LINES[i + 1]?.[1],
      voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.2, use_speaker_boost: true, speed: 0.95 },
    }),
  });
  if (!res.ok) throw new Error(`${id}: ${res.status} ${await res.text()}`);
  fs.writeFileSync(new URL(`${id}.mp3`, OUT), Buffer.from(await res.arrayBuffer()));
  console.log("wrote", `${id}.mp3`);
}

// ---- levelling ----------------------------------------------------------------------------------------------------
// Remotion's bundled ffmpeg decodes the mp3; the compressor and gain are done here so every line sits at one level.

const SR = 44100;
const tmp = path.join(os.tmpdir(), "journal-vo.wav");

for (const [id] of LINES) {
  const src = new URL(`${id}.mp3`, OUT).pathname;
  execFileSync("npx", ["remotion", "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", src, "-ac", "1", "-ar", String(SR), "-c:a", "pcm_s16le", tmp]);
  const wav = fs.readFileSync(tmp);
  const pcm = wav.subarray(wav.indexOf("data") + 8);
  const x = new Float32Array(pcm.length / 2);
  for (let i = 0; i < x.length; i++) x[i] = pcm.readInt16LE(i * 2) / 32768;

  // Compressor: 3:1 above -24 dBFS, 5 ms attack, 120 ms release.
  const att = Math.exp(-1 / (0.005 * SR)), rel = Math.exp(-1 / (0.12 * SR));
  let env = 0;
  for (let i = 0; i < x.length; i++) {
    const a = Math.abs(x[i]);
    env = a > env ? att * env + (1 - att) * a : rel * env + (1 - rel) * a;
    const db = 20 * Math.log10(env + 1e-9);
    const over = Math.max(0, db + 24);
    x[i] *= 10 ** (-(over * (1 - 1 / 3)) / 20);
  }
  // Every line to the same speech loudness (-17 dBFS RMS over the voiced samples), then a soft limiter for the peaks.
  let sum = 0, n = 0;
  for (const v of x) if (Math.abs(v) > 0.01) { sum += v * v; n++; }
  const gain = 10 ** (-17 / 20) / Math.sqrt(sum / n);
  for (let i = 0; i < x.length; i++) {
    const y = x[i] * gain, a = Math.abs(y);
    x[i] = a <= 0.7 ? y : Math.sign(y) * (0.7 + 0.28 * Math.tanh((a - 0.7) / 0.28));
  }
  sum = 0; n = 0;
  for (const v of x) if (Math.abs(v) > 0.01) { sum += v * v; n++; }

  const out = Buffer.alloc(44 + x.length * 2);
  out.write("RIFF", 0); out.writeUInt32LE(36 + x.length * 2, 4); out.write("WAVE", 8); out.write("fmt ", 12);
  out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22); out.writeUInt32LE(SR, 24);
  out.writeUInt32LE(SR * 2, 28); out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34); out.write("data", 36); out.writeUInt32LE(x.length * 2, 40);
  for (let i = 0; i < x.length; i++) out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, x[i])) * 32767), 44 + i * 2);
  fs.writeFileSync(new URL(`${id}.wav`, OUT), out);
  console.log("levelled", `${id}.wav`, "speech rms", (20 * Math.log10(Math.sqrt(sum / n))).toFixed(1), "dBFS");
}
fs.rmSync(tmp, { force: true });

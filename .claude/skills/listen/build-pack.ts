#!/usr/bin/env bun
/**
 * Build a listening pack: spec JSON -> one mp3 per item + a VitePress/Obsidian page.
 *
 * Usage:
 *   bun .claude/skills/listen/build-pack.ts .claude/skills/listen/packs/pack-01.json
 *     [--audio-only | --page-only] [--only 1,3] [--engine auto|edge|sapi]
 *
 * Output (relative to repo root):
 *   vault/listening/audio/<id>/qNN.mp3   mono, ~56 kbps, 24 kHz
 *   vault/listening/<id>.md              the practice page (generated; edit the JSON, not the page)
 *
 * TTS engines:
 *   edge  Microsoft Edge neural voices via `edge-tts` (PATH, `uvx edge-tts`, or `python -m edge_tts`).
 *         A = ja-JP-NanamiNeural, B = ja-JP-KeitaNeural.
 *   sapi  Windows SAPI (Haruka). B lines are pitch-shifted down with ffmpeg so the two speakers differ.
 *   auto  (default) edge, falling back to sapi on Windows when edge is unreachable.
 *
 * Spec item shapes (all text uses ruby syntax {漢字|かんじ}; the TTS text, the full-kana line and
 * the page transcript are all derived from it):
 *   sokuji  stem{t,zh}, options[3]{t,zh}, answer, stemVoice "A"|"B"   (問題4 即時応答)
 *   kadai | point  situation, questionZh, intro{t,zh}, question{t,zh}, dialogue[{s,t,zh}], options[]{t,zh}, answer
 * Common: level "N2", track "JLPT"|"日常", point (Chinese key point, may link to vault lessons).
 */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

// ---------- spec types ----------
type Line = { t: string; zh: string };
type Item = {
  type: "sokuji" | "kadai" | "point";
  level: string;
  track: "JLPT" | "日常";
  point: string;
  stemVoice?: "A" | "B";
  stem?: Line;
  situation?: string;
  questionZh?: string;
  intro?: Line;
  question?: Line;
  dialogue?: { s: "A" | "B"; t: string; zh: string }[];
  options: Line[];
  answer: number;
};
type Spec = { id: string; title: string; focus: string; items: Item[] };

// ---------- args ----------
const argv = process.argv.slice(2);
const flag = (n: string) => argv.includes(n);
const opt = (n: string) => {
  const i = argv.indexOf(n);
  return i >= 0 ? argv[i + 1] : undefined;
};
const specPath = argv.find((a, i) => !a.startsWith("--") && argv[i - 1] !== "--only" && argv[i - 1] !== "--engine");
if (!specPath) {
  console.error("usage: bun build-pack.ts <spec.json> [--audio-only|--page-only] [--only 1,3] [--engine auto|edge|sapi]");
  process.exit(1);
}
const REPO = resolve(import.meta.dir, "../../..");
const spec: Spec = JSON.parse(readFileSync(resolve(specPath), "utf8"));
const onlySet = opt("--only") ? new Set(opt("--only")!.split(",").map(Number)) : null;
const engineArg = (opt("--engine") ?? "auto") as "auto" | "edge" | "sapi";

// ---------- ruby helpers ----------
const RUBY = /\{([^|{}]+)\|([^|{}]+)\}/g;
const KANJI = /[々〆㐀-䶿一-鿿豈-﫿]/;
const KANA_ONLY = /^[ぁ-ゖァ-ヺー]+$/;
const NUM_START = /^[〇一二三四五六七八九十百千万]/;
const FORCE_READING = new Set(["明日", "昨日", "今日", "今朝", "大人"]);

const plain = (t: string) => t.replace(RUBY, "$1");
const kana = (t: string) => t.replace(RUBY, "$2");
/** Text fed to TTS: kanji, except numerals/counters and a few ambiguous words, which use the reading. */
const ttsText = (t: string) =>
  t.replace(RUBY, (_m, base: string, rd: string) => (NUM_START.test(base) || FORCE_READING.has(base) ? rd : base)).replace(/…+/g, "、");

function validate(spec: Spec) {
  const errs: string[] = [];
  spec.items.forEach((it, i) => {
    const n = i + 1;
    const texts: string[] = [it.point];
    const lines: Line[] = [...(it.stem ? [it.stem] : []), ...(it.intro ? [it.intro] : []), ...(it.question ? [it.question] : []), ...(it.dialogue ?? []), ...it.options];
    for (const l of lines) {
      for (const m of l.t.matchAll(RUBY)) {
        if (!KANJI.test(m[1])) errs.push(`item ${n}: ruby base has no kanji: ${m[0]}`);
        if (!KANA_ONLY.test(m[2])) errs.push(`item ${n}: ruby reading not kana: ${m[0]}`);
      }
      if (KANJI.test(kana(l.t))) errs.push(`item ${n}: kanji outside ruby: ${l.t}`);
      if (/[{}|]/.test(kana(l.t))) errs.push(`item ${n}: stray brace/pipe: ${l.t}`);
      if (!l.zh) errs.push(`item ${n}: missing zh: ${l.t}`);
    }
    if (!texts[0]) errs.push(`item ${n}: missing point`);
    if (!(it.answer >= 1 && it.answer <= it.options.length)) errs.push(`item ${n}: bad answer`);
    if (it.type === "sokuji" && (!it.stem || it.options.length !== 3)) errs.push(`item ${n}: sokuji needs stem + 3 options`);
    if (it.type !== "sokuji" && (!it.dialogue || !it.question || !it.situation || !it.questionZh)) errs.push(`item ${n}: kadai/point needs situation, questionZh, question, dialogue`);
  });
  if (errs.length) {
    console.error(errs.join("\n"));
    process.exit(1);
  }
}
validate(spec);

// ---------- segments ----------
type Seg = { kind: "tts"; voice: "A" | "B"; text: string; rate?: string } | { kind: "gap"; sec: number };
const LEAD = 0.9, TAIL = 0.7, GAP = 1.0, BEFORE_OPTIONS = 1.8, AFTER_INTRO = 1.2, BEFORE_QUESTION = 1.8;

function segments(it: Item): Seg[] {
  const s: Seg[] = [{ kind: "gap", sec: LEAD }];
  if (it.type === "sokuji") {
    const sv = it.stemVoice ?? "A";
    const ov = sv === "A" ? "B" : "A";
    s.push({ kind: "tts", voice: sv, text: ttsText(it.stem!.t) }, { kind: "gap", sec: BEFORE_OPTIONS });
    it.options.forEach((o, i) => {
      s.push({ kind: "tts", voice: ov, text: `${i + 1}。` }, { kind: "gap", sec: 0.35 }, { kind: "tts", voice: ov, text: ttsText(o.t) });
      if (i < it.options.length - 1) s.push({ kind: "gap", sec: GAP });
    });
  } else {
    // narrator = voice A at a slightly slower rate, so it reads as a different "speaker" from the dialogue
    s.push({ kind: "tts", voice: "A", text: ttsText((it.intro ?? it.question!).t), rate: "-8%" }, { kind: "gap", sec: AFTER_INTRO });
    it.dialogue!.forEach((d, i) => {
      s.push({ kind: "tts", voice: d.s, text: ttsText(d.t) });
      if (i < it.dialogue!.length - 1) s.push({ kind: "gap", sec: GAP });
    });
    s.push({ kind: "gap", sec: BEFORE_QUESTION }, { kind: "tts", voice: "A", text: ttsText(it.question!.t), rate: "-8%" });
  }
  s.push({ kind: "gap", sec: TAIL });
  return s;
}

// ---------- process helpers ----------
function run(cmd: string[], opts: { quiet?: boolean } = {}): Promise<{ code: number; out: string; err: string }> {
  return new Promise((res) => {
    const p = spawn(cmd[0], cmd.slice(1), { stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    let out = "", err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("error", (e) => res({ code: 127, out, err: String(e) }));
    p.on("close", (code) => res({ code: code ?? 1, out, err }));
  });
}

async function pool<T>(items: T[], n: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) await fn(items[i++]);
  }));
}

// ---------- TTS ----------
const CACHE = join(tmpdir(), "jp-listen-tts");
mkdirSync(CACHE, { recursive: true });
const EDGE_VOICE = { A: "ja-JP-NanamiNeural", B: "ja-JP-KeitaNeural" } as const;
const SAPI_PITCH = 0.84; // B voice: lower by ~16 % to separate it from A

async function findEdge(): Promise<string[] | null> {
  for (const base of [["edge-tts"], ["uvx", "edge-tts"], ["python", "-m", "edge_tts"]]) {
    const r = await run([...base, "--help"]);
    if (r.code === 0) return base;
  }
  return null;
}

const clipKey = (engine: string, seg: Extract<Seg, { kind: "tts" }>) =>
  createHash("sha1").update([engine, seg.voice, seg.rate ?? "", seg.text].join("\u0001")).digest("hex").slice(0, 20);

async function synthEdge(base: string[], need: Extract<Seg, { kind: "tts" }>[]): Promise<boolean> {
  let ok = true;
  await pool(need, 4, async (seg) => {
    const out = join(CACHE, `edge-${clipKey("edge", seg)}.mp3`);
    if (existsSync(out)) return;
    const args = [...base, "--voice", EDGE_VOICE[seg.voice], ...(seg.rate ? [`--rate=${seg.rate}`] : []), "--text", seg.text, "--write-media", out + ".part"];
    const r = await run(args);
    if (r.code !== 0 || !existsSync(out + ".part") || statSync(out + ".part").size < 500) {
      ok = false;
      console.error(`edge-tts failed for "${seg.text}": ${r.err.trim().split("\n").pop()}`);
      return;
    }
    await Bun.write(out, Bun.file(out + ".part"));
    rmSync(out + ".part", { force: true });
  });
  return ok;
}

const SAPI_PS = `param([string]$Json)
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$v = @($s.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -eq 'ja-JP' } | ForEach-Object { $_.VoiceInfo.Name })
if ($v.Count -eq 0) { [Console]::Error.WriteLine('no ja-JP voice'); exit 2 }
$s.SelectVoice($v[0])
$fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(22050, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
$jobs = Get-Content -Raw -Encoding UTF8 $Json | ConvertFrom-Json
foreach ($j in $jobs) {
  $s.SetOutputToWaveFile($j.file, $fmt)
  $s.Rate = [int]$j.rate
  $s.Speak($j.text)
  $s.SetOutputToNull()
}
$s.Dispose()
`;

async function synthSapi(need: Extract<Seg, { kind: "tts" }>[]): Promise<boolean> {
  const todo = need.filter((s) => !existsSync(join(CACHE, `sapi-${clipKey("sapi", s)}.wav`)));
  if (todo.length === 0) return true;
  const dir = mkdtempSync(join(tmpdir(), "jp-sapi-"));
  try {
    const ps1 = join(dir, "synth.ps1");
    const jobs = join(dir, "jobs.json");
    writeFileSync(ps1, SAPI_PS);
    writeFileSync(jobs, JSON.stringify(todo.map((s) => ({ file: join(CACHE, `sapi-${clipKey("sapi", s)}.wav`), text: s.text, rate: s.rate ? Math.round(parseInt(s.rate) / 10) : 0 }))), "utf8");
    const r = await run(["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps1, "-Json", jobs]);
    if (r.code !== 0) console.error(`sapi failed (${r.code}): ${r.err.trim()}`);
    return r.code === 0;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// ---------- assemble ----------
async function assemble(it: Item, engine: "edge" | "sapi", out: string) {
  const segs = segments(it);
  const inputs: string[] = [];
  const chains: string[] = [];
  segs.forEach((s, i) => {
    if (s.kind === "gap") {
      inputs.push("-f", "lavfi", "-t", String(s.sec), "-i", "anullsrc=r=24000:cl=mono");
      chains.push(`[${i}:a]aresample=24000,aformat=sample_fmts=fltp:channel_layouts=mono[a${i}]`);
    } else {
      const f = join(CACHE, engine === "edge" ? `edge-${clipKey("edge", s)}.mp3` : `sapi-${clipKey("sapi", s)}.wav`);
      inputs.push("-i", f);
      const shift = engine === "sapi" && s.voice === "B" ? `asetrate=22050*${SAPI_PITCH},aresample=22050,atempo=${(1 / SAPI_PITCH).toFixed(4)},` : "";
      chains.push(`[${i}:a]${shift}aresample=24000,aformat=sample_fmts=fltp:channel_layouts=mono[a${i}]`);
    }
  });
  const concat = segs.map((_, i) => `[a${i}]`).join("") + `concat=n=${segs.length}:v=0:a=1,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=24000[out]`;
  const filter = [...chains, concat].join(";");
  const r = await run(["ffmpeg", "-y", "-loglevel", "error", ...inputs, "-filter_complex", filter, "-map", "[out]", "-ac", "1", "-ar", "24000", "-c:a", "libmp3lame", "-b:a", "56k", out]);
  if (r.code !== 0) throw new Error(`ffmpeg failed for ${basename(out)}: ${r.err}`);
}

async function buildAudio(): Promise<{ engine: string }> {
  const audioDir = join(REPO, "vault/listening/audio", spec.id);
  mkdirSync(audioDir, { recursive: true });
  const chosen = spec.items.map((it, i) => ({ it, n: i + 1 })).filter((x) => !onlySet || onlySet.has(x.n));
  const need = new Map<string, Extract<Seg, { kind: "tts" }>>();
  for (const { it } of chosen) for (const s of segments(it)) if (s.kind === "tts") need.set(`${s.voice}|${s.rate ?? ""}|${s.text}`, s);
  const clips = [...need.values()];

  let engine: "edge" | "sapi" | null = null;
  if (engineArg !== "sapi") {
    const base = await findEdge();
    if (base && (await synthEdge(base, clips))) engine = "edge";
    else if (engineArg === "edge") throw new Error("edge-tts unavailable or failed");
  }
  if (!engine) {
    if (process.platform !== "win32") throw new Error("no TTS engine: edge-tts failed and SAPI is Windows-only");
    console.error("falling back to Windows SAPI (Haruka), B lines pitch-shifted");
    if (!(await synthSapi(clips))) throw new Error("SAPI synthesis failed");
    engine = "sapi";
  }

  for (const { it, n } of chosen) {
    const out = join(audioDir, `q${String(n).padStart(2, "0")}.mp3`);
    await assemble(it, engine, out);
    const kb = (statSync(out).size / 1024).toFixed(0);
    console.log(`q${String(n).padStart(2, "0")}.mp3  ${kb} KB`);
  }
  return { engine };
}

// ---------- page ----------
const TYPE_LABEL = { sokuji: "即時応答", kadai: "課題理解", point: "ポイント理解" } as const;
const LEVEL_ORDER = ["N5", "N4", "N3", "N2", "N1"];

function buildPage(): string {
  const levels = [...new Set(spec.items.map((i) => i.level))].sort((a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b));
  const counts = (["sokuji", "kadai", "point"] as const).map((t) => [t, spec.items.filter((i) => i.type === t).length] as const).filter(([, c]) => c > 0);
  const mix = counts.map(([t, c]) => `${TYPE_LABEL[t]} ${c}`).join("・");
  const out: string[] = [];
  out.push(
    "---",
    `title: ${spec.title}`,
    `aliases: [聽力 ${spec.id}, listening ${spec.id}, 聴解 ${spec.id}]`,
    "tags: [japanese, listening, jlpt]",
    `level: [${levels.join(", ")}]`,
    "type: practice",
    "---",
    "",
    `<!-- 由 .claude/skills/listen/build-pack.ts 依 .claude/skills/listen/packs/${spec.id}.json 產生；要改內容請改 JSON 再重跑，不要直接改這頁。 -->`,
    "",
    `# ${spec.title}`,
    "",
    `${spec.items.length} 題（${mix}）。重點：${spec.focus}。`,
    "",
    "戴耳機，每題只聽一次（真的聽不清楚才重播），先選答案再展開「答案與原文」。錯的題號回報給 Claude，例如「聽力 " + spec.id + " 錯 3、7」。用法見[聽力練習總覽](index.md)。",
    ""
  );
  spec.items.forEach((it, idx) => {
    const n = idx + 1;
    const q = String(n).padStart(2, "0");
    out.push(`## 第${n}題　${TYPE_LABEL[it.type]}〔${it.level}〕　${it.track} track`, "");
    out.push(`<audio controls preload="none"><source src="./audio/${spec.id}/q${q}.mp3" type="audio/mpeg"></audio>`, "");
    if (it.type !== "sokuji") {
      out.push(`**情境**：${it.situation}`, "", `**提問**：${it.questionZh}`, "");
      it.options.forEach((o, i) => out.push(`${i + 1}. ${o.t}`));
      out.push("");
    } else {
      out.push("請選 1–3（畫面上不顯示日文）。", "");
    }
    const mark = (i: number) => (i + 1 === it.answer ? " ✓" : "");
    out.push("<details>", "<summary>答案與原文</summary>", "", `**答案**：${it.answer}`, "");
    // transcript, ruby
    const block = (title: string, f: (l: Line) => string, label: (l: Line, i: number) => string, optLabel: (i: number) => string) => {
      out.push(`**${title}**`, "");
      if (it.type === "sokuji") {
        out.push(`- 題幹：${f(it.stem!)}`);
      } else {
        out.push(`- 開場：${f(it.intro ?? it.question!)}`);
        it.dialogue!.forEach((d) => out.push(`- ${d.s}：${f(d)}`));
        out.push(`- 提問：${f(it.question!)}`);
      }
      it.options.forEach((o, i) => out.push(`- ${optLabel(i)}${f(o)}${mark(i)}`));
      out.push("");
    };
    const lab = (i: number) => `選項 ${i + 1}：`;
    block("原文", (l) => l.t, () => "", lab);
    block("全假名", (l) => kana(l.t), () => "", lab);
    block("中文", (l) => l.zh, () => "", lab);
    out.push(`**重點**：${it.point}`, "", "</details>", "");
  });
  return out.join("\n");
}

// ---------- main ----------
async function main() {
  let engine = "-";
  if (!flag("--page-only")) ({ engine } = await buildAudio());
  if (!flag("--audio-only")) {
    const page = join(REPO, "vault/listening", `${spec.id}.md`);
    mkdirSync(dirname(page), { recursive: true });
    writeFileSync(page, buildPage(), "utf8");
    console.log(`page: vault/listening/${spec.id}.md`);
  }
  console.log(`engine: ${engine}`);
}
main().catch((e) => {
  console.error(String(e?.message ?? e));
  process.exit(1);
});

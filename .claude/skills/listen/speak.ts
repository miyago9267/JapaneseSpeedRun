#!/usr/bin/env bun
/**
 * Speak Japanese lines aloud for listening drills (macOS `say`, Windows SAPI).
 *
 * Usage: bun .claude/skills/listen/speak.ts [--slow] "A: 文" "B: 文" "1. 文" ...
 *   - A line prefixed `B:` uses a second ja-JP voice when one exists; every other line uses the first.
 *   - The `A:` / `B:` prefix is not spoken; `1.` style prefixes are spoken (exam option numbers).
 *   - `--slow` lowers the speaking rate for replays.
 * Exit 2 when no ja-JP voice is installed.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
const slow = args.includes("--slow");
const lines = args.filter((a) => a !== "--slow");
if (lines.length === 0) {
  console.error('usage: bun speak.ts [--slow] "A: 文" ...');
  process.exit(1);
}

const parse = (line: string) => {
  const m = line.match(/^\s*([AB])\s*[:：]\s*(.*)$/);
  return m ? { second: m[1] === "B", text: m[2] } : { second: false, text: line };
};

const LEAD_MS = 900;
const TAIL_MS = 700;

const fail = (msg: string): never => {
  console.error(msg);
  process.exit(2);
};

function speakMac() {
  const list = Bun.spawnSync(["say", "-v", "?"]).stdout.toString();
  const voices = list
    .split("\n")
    .map((l) => l.match(/^(.+?)\s{2,}ja_JP\b/)?.[1].trim())
    .filter((v): v is string => !!v);
  if (voices.length === 0) fail("no ja_JP voice: System Settings > Accessibility > Spoken Content > add Japanese voice");
  const hq = (v: string) => /Enhanced|Premium|加強|高品質/.test(v);
  const pick = (name: string) => voices.find((v) => v.startsWith(name) && hq(v)) ?? voices.find((v) => v.startsWith(name));
  const first = pick("O-Ren") ?? pick("Kyoko") ?? voices[0];
  const second = [pick("Kyoko"), pick("Otoya"), ...voices].find((v) => v && v !== first) ?? first;
  const rate = slow ? "120" : "175";
  for (const line of lines) {
    const { second: useSecond, text } = parse(line);
    // Leading/trailing silence keeps Bluetooth output from clipping the first and last syllables.
    Bun.spawnSync(["say", "-v", useSecond ? second : first, "-r", rate, `[[slnc ${LEAD_MS}]]${text}[[slnc ${TAIL_MS}]]`]);
  }
}

const PS_SCRIPT = `param([string]$TextFile, [int]$Rate)
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$v = @($s.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -eq 'ja-JP' } | ForEach-Object { $_.VoiceInfo.Name })
if ($v.Count -eq 0) { [Console]::Error.WriteLine('no ja-JP voice'); exit 2 }
$s.Rate = $Rate
foreach ($line in Get-Content -Encoding UTF8 $TextFile) {
  $idx = [int]$line.Substring(0, 1)
  $s.SelectVoice($v[[Math]::Min($idx, $v.Count - 1)])
  $p = New-Object System.Speech.Synthesis.PromptBuilder
  $p.AppendBreak([TimeSpan]::FromMilliseconds(900))
  $p.AppendText($line.Substring(2))
  $p.AppendBreak([TimeSpan]::FromMilliseconds(700))
  $s.Speak($p)
}
`;

function speakWindows() {
  const dir = mkdtempSync(join(tmpdir(), "jp-listen-"));
  try {
    const ps1 = join(dir, "speak.ps1");
    const txt = join(dir, "lines.txt");
    writeFileSync(ps1, PS_SCRIPT);
    const body = lines
      .map((l) => {
        const { second, text } = parse(l);
        return `${second ? 1 : 0} ${text}`;
      })
      .join("\n");
    writeFileSync(txt, body, "utf8");
    const r = Bun.spawnSync(
      ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps1, "-TextFile", txt, "-Rate", slow ? "-3" : "0"],
      { stderr: "inherit" },
    );
    if (r.exitCode === 2) fail("no ja-JP voice: Settings > Time & language > Language > Japanese > Options > install Speech");
    if (r.exitCode !== 0) process.exit(r.exitCode ?? 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (process.platform === "darwin") speakMac();
else if (process.platform === "win32") speakWindows();
else fail(`unsupported platform: ${process.platform}`);

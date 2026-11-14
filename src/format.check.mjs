// node src/format.check.mjs: how the chips write the status line's figures, compiled from the real source.
import assert from "node:assert/strict";
import { build } from "esbuild";

const entry = new URL("./format.ts", import.meta.url).pathname.replace(/^\/(\w:)/, "$1");
const out = await build({ entryPoints: [entry], bundle: true, write: false, format: "esm", platform: "node" });
const f = await import("data:text/javascript;base64," + Buffer.from(out.outputFiles[0].text).toString("base64"));

assert.equal(f.k(999), "999");
assert.equal(f.k(80700), "80.7k");
assert.equal(f.duration(18075), "0m");
assert.equal(f.duration(42 * 60000), "42m");
assert.equal(f.duration(82 * 60000 + 5000), "1h 22m");
assert.equal(f.usd(0.0069), "$0.0069");
assert.equal(f.usd(0.4837), "$0.48");
assert.equal(f.tone(10), "#4ade80");
assert.equal(f.tone(50), "#fbbf24");
assert.equal(f.tone(80), "#f87171");

// resets_at comes as seconds (Claude Code's status line); an ISO date or ms works too.
const at = new Date(2026, 10, 19, 14, 5).getTime();
assert.equal(f.resets(at / 1000, false), "14:05");
assert.equal(f.resets(at, true), "Thu 14:05");
assert.equal(f.resets(new Date(at).toISOString(), false), "14:05");
assert.equal(f.resets(undefined, false), "");
assert.equal(f.resets("nonsense", false), "");

// A capture's name and its label in the band; other files are not captures.
const name = f.captureName("phone", new Date(2026, 10, 14, 17, 5, 12).getTime());
assert.equal(name, "phone-20261114-170512.png");
assert.equal(f.captureLabel(name), "☏ 17:05");
assert.equal(f.captureLabel("snip-20261114-090000.png"), "⎚ 09:00");
assert.equal(f.captureLabel("notes.png"), null);

// PowerShell's -EncodedCommand is UTF-16LE.
assert.equal(Buffer.from(f.encodePs("hé"), "base64").toString("utf16le"), "hé");
assert.equal(f.quote("C:\\a b\\c.png"), "\"C:\\a b\\c.png\"");
assert.equal(f.quote("C:\\a\\c.png"), "C:\\a\\c.png");

console.log("chat-status: all checks passed");

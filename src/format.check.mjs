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

// The cache: time left from expires_at in seconds; nothing once it has run out.
const t = 1_000_000_000_000;
assert.deepEqual(f.cacheLeft(t / 1000 + 40, t), { ms: 40_000, label: "40s" });
assert.equal(f.cacheLeft(t / 1000 + 48 * 60 + 30, t).label, "48m");
assert.equal(f.cacheLeft(t / 1000 + 3900, t).label, "1h 5m");
assert.equal(f.cacheLeft(t / 1000, t), null);
assert.equal(f.cacheLeft(t / 1000 - 5, t), null);
assert.equal(f.cacheLeft(NaN, t), null);
assert.equal(f.cacheTone(20 * 60_000), "#4ade80");
assert.equal(f.cacheTone(5 * 60_000), "#fbbf24");
assert.equal(f.cacheTone(60_000), "#f87171");

console.log("claude-status: all checks passed");

#!/usr/bin/env node
/*
 * fix-generated-identifiers.mjs
 *
 * The Power connector code generator can emit invalid TypeScript identifiers for
 * header parameters that contain hyphens (e.g. the `If-Match` header on the
 * Microsoft Teams connector's Section operations). Hyphens are illegal in TS
 * identifiers, so the generated file fails to compile.
 *
 * This deterministic, idempotent post-generation patch renames hyphenated
 * parameter identifiers to camelCase (If-Match -> IfMatch) in src/generated/**.
 * It is chained into `prebuild` so it re-applies automatically after any
 * `pac code add-data-source` regeneration. We never edit generated files by
 * hand — this script regenerates the fix on demand.
 *
 * IMPORTANT: only code *outside* string literals is rewritten. Hyphenated text
 * inside strings (e.g. the import path `@microsoft/power-apps`, or operation
 * names) is left untouched. The generator only ever emits hyphenated header
 * names as bare identifiers (parameter names / object shorthand), never as
 * quoted strings, so this is safe and complete.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const GENERATED_DIR = join(process.cwd(), 'src', 'generated');

const HYPHEN_IDENT = /\b([A-Za-z_$][A-Za-z0-9_$]*)-([A-Za-z_$][A-Za-z0-9_$]*)\b/g;

function camel(a, b) {
  return a + b.charAt(0).toUpperCase() + b.slice(1);
}

/**
 * Rewrite hyphenated identifiers only in the code segments of a line, skipping
 * anything inside ' " or ` string literals. Returns the possibly-modified line.
 */
function patchLine(line) {
  let out = '';
  let i = 0;
  let quote = null; // active string delimiter, or null
  let buf = ''; // accumulates current code (non-string) run
  const flush = () => {
    if (buf) {
      out += buf.replace(HYPHEN_IDENT, (_m, a, b) => camel(a, b));
      buf = '';
    }
  };
  while (i < line.length) {
    const ch = line[i];
    if (quote) {
      out += ch;
      if (ch === quote && line[i - 1] !== '\\') quote = null;
      i++;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      flush();
      quote = ch;
      out += ch;
      i++;
      continue;
    }
    buf += ch;
    i++;
  }
  flush();
  return out;
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith('.ts')) out.push(p);
  }
  return out;
}

let files = [];
try {
  files = walk(GENERATED_DIR);
} catch {
  process.exit(0);
}

let patched = 0;
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');
  let changed = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();
    if (trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;
    if (line.indexOf('-') === -1) continue;
    const next = patchLine(line);
    if (next !== line) {
      lines[i] = next;
      changed = true;
    }
  }
  if (changed) {
    writeFileSync(file, lines.join('\n'), 'utf8');
    patched++;
    console.log(`  patched ${file.replace(process.cwd() + '/', '')}`);
  }
}

console.log(patched ? `fix-generated-identifiers: patched ${patched} file(s).` : 'fix-generated-identifiers: nothing to patch.');

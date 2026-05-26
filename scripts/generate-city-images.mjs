#!/usr/bin/env node
// Generate one cinematic 16:9 image per Madagascar city via Higgsfield CLI.
//
// Usage:
//   node scripts/generate-city-images.mjs                # all cities, gpt_image_2
//   node scripts/generate-city-images.mjs --model z_image
//   node scripts/generate-city-images.mjs --only "Nosy Be,Ambositra,Morondava"
//   node scripts/generate-city-images.mjs --resume       # skip cities already in city-images.json
//   node scripts/generate-city-images.mjs --dry-run
//
// Requires: higgsfield CLI logged in (`higgsfield auth login`).

import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PROMPTS_PATH = path.join(__dirname, 'city-prompts.json');
const OUTPUT_PATH = path.join(__dirname, 'city-images.json');
const PUBLIC_DIR = path.join(ROOT, 'public', 'images', 'cities');

const args = parseArgs(process.argv.slice(2));
const MODEL = args.model || 'gpt_image_2';
const ASPECT = args.aspect || '16:9';
const RESOLUTION = args.resolution || '2k';
const DRY = Boolean(args['dry-run']);
const RESUME = Boolean(args.resume);
const DOWNLOAD = args.download !== 'false';
const ONLY = args.only ? args.only.split(',').map(s => s.trim()).filter(Boolean) : null;

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

function slug(s) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function run(cmd, cmdArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => { stdout += d.toString(); });
    child.stderr.on('data', d => { stderr += d.toString(); });
    child.on('error', reject);
    child.on('close', code => {
      if (code !== 0) {
        const err = new Error(`${cmd} exited with code ${code}: ${stderr || stdout}`);
        err.stdout = stdout;
        err.stderr = stderr;
        err.code = code;
        return reject(err);
      }
      resolve({ stdout, stderr });
    });
  });
}

async function downloadImage(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed (${res.status}) for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buf);
}

async function main() {
  const raw = await fs.readFile(PROMPTS_PATH, 'utf8');
  const data = JSON.parse(raw);
  const prompts = data.prompts;

  let existing = {};
  if (RESUME) {
    try {
      existing = JSON.parse(await fs.readFile(OUTPUT_PATH, 'utf8'));
    } catch { /* no prior file */ }
  }

  const cityNames = Object.keys(prompts).filter(c => !ONLY || ONLY.includes(c));

  console.log(`▶ Cities to generate: ${cityNames.length}`);
  console.log(`  Model: ${MODEL} | Aspect: ${ASPECT} | Resolution: ${RESOLUTION}`);
  console.log(`  Dry-run: ${DRY} | Resume: ${RESUME} | Download: ${DOWNLOAD}`);
  console.log('');

  const results = { ...existing };

  for (const city of cityNames) {
    if (RESUME && results[city]?.url) {
      console.log(`✓ ${city} — skipped (resume)`);
      continue;
    }
    const prompt = prompts[city];
    if (!prompt) {
      console.warn(`! ${city} — no prompt, skipping`);
      continue;
    }

    if (DRY) {
      console.log(`[dry] ${city}\n      ${prompt.slice(0, 100)}...`);
      continue;
    }

    const cliArgs = [
      'generate', 'create', MODEL,
      '--prompt', prompt,
      '--aspect_ratio', ASPECT,
      '--wait',
      '--wait-timeout', '20m',
    ];
    if (MODEL === 'gpt_image_2' || MODEL === 'imagegen_2_0') {
      cliArgs.push('--resolution', RESOLUTION);
    }

    process.stdout.write(`→ ${city} ... `);
    try {
      const { stdout } = await run('higgsfield', cliArgs);
      const url = stdout.trim().split('\n').filter(l => l.startsWith('http')).pop();
      if (!url) throw new Error('no URL in CLI output:\n' + stdout);

      let localPath = null;
      if (DOWNLOAD) {
        const filename = `${slug(city)}.png`;
        const dest = path.join(PUBLIC_DIR, filename);
        await downloadImage(url, dest);
        localPath = `/images/cities/${filename}`;
      }

      results[city] = {
        url,
        localPath,
        model: MODEL,
        aspect: ASPECT,
        generated_at: new Date().toISOString(),
      };
      await fs.writeFile(OUTPUT_PATH, JSON.stringify(results, null, 2));
      console.log(`OK  ${url}`);
    } catch (err) {
      console.error(`FAIL\n      ${err.message.split('\n')[0]}`);
      results[city] = { error: err.message.split('\n')[0], failed_at: new Date().toISOString() };
      await fs.writeFile(OUTPUT_PATH, JSON.stringify(results, null, 2));
      if (/not_enough_credits|minimum_pro_plan|minimum_basic_plan|Session expired/i.test(err.message)) {
        console.error('\n⛔ Credit / plan / auth error — aborting batch. Recharge or re-auth then re-run with --resume.');
        process.exit(2);
      }
    }
  }

  console.log(`\n✔ Done. Manifest: ${OUTPUT_PATH}`);
  if (DOWNLOAD) console.log(`  Images: ${PUBLIC_DIR}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

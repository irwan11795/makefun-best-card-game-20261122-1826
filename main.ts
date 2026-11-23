// Ember Court — make.fun best-card-game entry (Node 22, standard library only).
//
// The game is the plain static files in game/ (index.html plus ES modules and
// one stylesheet, no library, no network request). This program hands the game
// in: it copies game/ and screenshots/ from beside this file into /output and
// writes /output/dossier.json, the summary the judge reads, using the kit's
// vendored buildDossier from vendor/makefun-game.ts.
//
// Play it locally with any static server over game/, e.g. `node serve.ts`
// from the kit's starter, or `npx serve game`. Outside the grader's container
// MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's caps, as the kit's gate states them: the dossier text is capped
// at 160 KiB; at most 4 screenshots of at most 256 KiB each; game/ holds at
// most 993 files and 48 MiB in all, with no path over 1000 bytes. Everything
// under /output shares the platform's 1000-entry, 64 MiB cap, so the game,
// its screenshots and dossier.json are kept well inside it.
// The program runs twice in the grader and both runs must write the same
// bytes: the copy is a plain file copy and buildDossier is deterministic for
// the same input files, so the two runs agree byte for byte.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

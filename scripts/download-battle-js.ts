#!/usr/bin/env npx ts-node
/**
 * @file
 * Download FFRK's battle.js and beautify it.
 *
 * @see https://www.reddit.com/r/FFRecordKeeper/wiki/index/game_code/battle_js
 */

import axios from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';

const safeEval = require('safe-eval');
const beautify = require('js-beautify').js;

// tslint:disable no-console

const workPath = path.join(__dirname, 'tmp');
fs.ensureDirSync(workPath);

const battleJsUrl = 'https://ffrk.static.denagames.com/dff/static/ww/compile/en/js/battle.js';

/**
 * Unpacks any eval-based JavaScript, using the safe-eval module.  See
 * https://www.npmjs.com/package/safe-eval
 *
 * js-beautifier has its own unpacker, but it apparently doesn't expose it...
 * See https://github.com/beautify-web/js-beautify/blob/master/js/src/unpackers/p_a_c_k_e_r_unpacker.js
 */
function unpackJs(rawJs: string) {
  const prefix = 'eval(';
  const suffix = ')';

  if (!rawJs.startsWith(prefix) || !rawJs.endsWith(suffix)) {
    throw new Error('Unexpected JS received');
  }

  return safeEval(rawJs.substring(prefix.length, rawJs.length - suffix.length));
}

async function downloadAndProcess(url: string) {
  const localFilename = path.join(workPath, path.basename(url));
  const response = await axios.get(url);
  const rawJs = response.data;
  const unpackedJs = unpackJs(rawJs);
  const prettyJs = beautify(unpackedJs);
  fs.writeFileSync(localFilename, prettyJs);
}

async function main() {
  await downloadAndProcess(battleJsUrl);
}

main().catch(e => console.error(e));

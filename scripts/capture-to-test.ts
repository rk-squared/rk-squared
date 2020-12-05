#!/usr/bin/env npx ts-node
/**
 * @file
 * Take a captured JSON, strip out uninteresting and sensitive bits, and save it
 * as data for our automated tests.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as process from 'process';

const repoDir = path.normalize(path.join(__dirname, '..'));

function convertFile(filename: string) {
  let newFilename = path.basename(filename);
  if (newFilename.endsWith('_dff_.json')) {
    newFilename = 'startup.json';
  } else {
    newFilename = newFilename.replace(/^[0-9-]+_dff_/, '');
  }
  newFilename = path.join(repoDir, 'app', 'proxy', '__tests__', 'data', newFilename);
  console.log(newFilename);

  if (!fs.existsSync(filename)) {
    filename = path.join(repoDir, 'captures', filename);
  }

  const capture = fs.readJsonSync(filename);

  const newData: any = { url: capture.url, data: capture.data };
  if (capture.requestBody) {
    newData.requestBody = capture.requestBody;
  }
  fs.writeFileSync(newFilename, JSON.stringify(newData, null, 2));
}

process.argv.splice(2).forEach(convertFile);

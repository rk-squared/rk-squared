#!/usr/bin/env -S npx ts-node

import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';

import { initialState as initialPrefsState } from '../app/reducers/prefs';

const { build } = require('../package.json');

// tslint:disable no-console

// Based on https://stackoverflow.com/a/26227660/25507
const appDataPath =
  process.env.APPDATA ||
  path.join(
    process.env.HOME,
    process.platform === 'darwin' ? 'Library/Application Support' : '.local/share',
  );
const userDataPath = path.join(appDataPath, build.productName);

const configPath = path.join(userDataPath, 'config.json');
const rawConfig = fs.readJsonSync(configPath);
let config = JSON.parse(rawConfig['persist:root']);
config = _.mapValues(config, JSON.parse);

// Anonymize and reset user preferences.
// TODO: More thorough
config.relicDraws.want = {};
config.prefs = initialPrefsState;

const outputPath = path.join(__dirname, '..', 'app', 'tmp', 'store.json');
const tmpOutputPath = outputPath + '.new';

fs.writeFileSync(tmpOutputPath, JSON.stringify(config, undefined, 2));
fs.moveSync(tmpOutputPath, outputPath, { overwrite: true });
console.log(`Exported ${configPath} to ${outputPath}`);

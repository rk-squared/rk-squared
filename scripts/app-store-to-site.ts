#!/usr/bin/env npx ts-node

import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';

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

const rawConfig = fs.readJsonSync(path.join(userDataPath, 'config.json'));
let config = JSON.parse(rawConfig['persist:root']);
config = _.mapValues(config, JSON.parse);

const outputPath = path.join(__dirname, '..', 'public', 'data');

console.log(JSON.stringify(config, undefined, 2));

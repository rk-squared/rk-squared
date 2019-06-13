#!/usr/bin/env npx ts-node

import * as probabilities from '../app/data/probabilities';

import * as process from 'process';

// tslint:disable: no-console

if (!process.argv[2]) {
  console.error('Usage: probabilities.ts desiredCount');
  process.exit(2);
}

const drawCount = 11;
const rareChance = 0.14;
const desiredChance = (+process.argv[2] / 14) * 0.14;

console.log('Solved form:');
console.log(probabilities.chanceOfDesiredDrawProp5(drawCount, rareChance, desiredChance));
console.log('Monte Carlo:');
console.log(probabilities.monteCarloProp5(drawCount, rareChance, desiredChance, 100000));

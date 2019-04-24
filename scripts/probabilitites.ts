#!/usr/bin/env npx ts-node

import * as probabilities from '../app/data/probabilities';

// tslint:disable: no-console

const drawCount = 11;
const rareChance = 0.14;
const desiredChance = (+process.argv[2] / 14) * 0.14;

console.log(probabilities.chanceOfDesiredDrawProp5(drawCount, rareChance, desiredChance));
console.log(probabilities.monteCarloProp5(drawCount, rareChance, desiredChance, 100000));

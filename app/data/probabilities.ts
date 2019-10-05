/**
 * @file
 *
 * Calculations of relic draw banner probabilities.
 *
 * See https://www.reddit.com/r/FFRecordKeeper/comments/83l3jd/analysis_of_fuitads_gacha_data/
 *
 * As described there:
 *
 * - Proposal 1: 1 guaranteed 5* / 6*, then 10 random relics with a 14.04% rate
 * - Proposal 2: 1 guaranteed 5* / 6*, then 10 random relics with a
 *   11.6667% (7/60) rate
 * - Proposal 3: 10 random relics with a 14.04% rate, then a guaranteed 5* / 6*
 *   if none already rolled, otherwise an 11th relic at the same rate
 * - Proposal 4: 10 random relics with a 18.7738% rate, then a guaranteed
 *   5* / 6* if none already rolled, otherwise an 11th relic at the same rate
 * - Proposal 5: 11 random relics with a 14.04% rate, all of which are
 *   simultaneously re-rolled until at least one is 5* / 6*
 * - Proposal 6: 11 random relics with a 17.2398% rate, all of which are
 *   simultaneously re-rolled until at least one is 5* / 6*
 */

export const StandardDrawCount = 11;

export const StandardMythrilCost = 50;
export const RealmRelicDrawMythrilCost = 15;

export const StandardGuaranteedRarity = 5;

interface RelicDrawBannerChances {
  expectedValue: number;
  desiredChance: number;
}

/**
 * Analysis of probabilities, following proposal 5 on Reddit.
 *
 * @param drawCount              Number of items in this banner (usually 11)
 * @param rareChancePerRelic     Total chance of getting a 5* or 6* (e.g., 0.1404)
 * @param desiredChancePerRelic  Total chance of getting something desirable (e.g., 0.05)
 */
export function chanceOfDesiredDrawProp5(
  drawCount: number,
  rareChancePerRelic: number,
  desiredChancePerRelic: number,
): RelicDrawBannerChances {
  // If x is the percentage of getting a 5* or better
  // and y is the percentage of getting what you care about,
  // then an 11 draw has the following possible outcomes:
  // - x chance of getting rare plus 10 * x rares
  // - (1 - x) * x chance of getting rare plus 9 * x rares
  // - (1 - x) ^ 2 * x chance of getting rare + 8 * x rares
  // - etc.
  // - (1 - x) ^ 11 chance of getting nothing and re-rolling
  const n = drawCount;
  const x = rareChancePerRelic;
  const y = desiredChancePerRelic;

  let totalEv = 0;
  let totalDesiredChance = 0;
  for (let i = 0; i < n; i++) {
    // Chance of not getting a rare for the preceding i draws then getting a
    // rare on this draw.
    const chanceOfThisOutcome = (1 - x) ** i * x;

    // Expected value for this arrangement of not getting a rare for the
    // preceding i draws then getting a rare on this draw.
    const evForThisOutcome = y / x + y * (n - 1 - i);

    const undesiredChanceForThisOutcome = ((x - y) / x) * (1 - y) ** (n - 1 - i);

    totalEv += chanceOfThisOutcome * evForThisOutcome;
    totalDesiredChance += chanceOfThisOutcome * (1 - undesiredChanceForThisOutcome);
  }

  const chanceOfNone = (1 - x) ** n;
  const r = chanceOfNone;

  // Sum of an infinite geometric series is a / (1 - r).
  return {
    expectedValue: totalEv / (1 - r),
    desiredChance: totalDesiredChance / (1 - r),
  };
}

/**
 * Performs a Monte Carlo simulation of proposal 5 on Reddit, to help validate
 * assumptions.  See chanceOfDesiredDrawProp5.
 */
export function monteCarloProp5(
  drawCount: number,
  rareChance: number,
  desiredChance: number,
  iterations: number,
): RelicDrawBannerChances {
  let totalCount = 0;
  let atLeast1Count = 0;
  for (let i = 0; i < iterations; i++) {
    let thisRareCount = 0;
    let thisDesiredCount = 0;
    while (thisRareCount === 0) {
      for (let j = 0; j < drawCount; j++) {
        const result = Math.random();
        if (result < desiredChance) {
          thisDesiredCount++;
        }
        if (result < rareChance) {
          thisRareCount++;
        }
      }
    }
    totalCount += thisDesiredCount;
    atLeast1Count += thisDesiredCount > 0 ? 1 : 0;
  }
  return {
    expectedValue: totalCount / iterations,
    desiredChance: atLeast1Count / iterations,
  };
}

/**
 * Specific (memoized) details of relic probabilities, as input to relic draw
 * simulators (simulateDrawProp5)
 */
export interface RelicProbability {
  relicId: number;
  rarity: number;
  probability: number;
}

/**
 * Parameters for a single pull on a relic draw banner.
 */
export interface RelicDrawPullParams {
  drawCount: number;
  guaranteedRarity: number;
  guaranteedCount: number;
}

export function simulateDrawProp5(
  probabilities: RelicProbability[],
  { drawCount, guaranteedRarity, guaranteedCount }: RelicDrawPullParams,
): number[] {
  const maxTries = 10000;
  let drawn: number[] = [];
  for (let tryCount = 0; tryCount < maxTries; tryCount++) {
    drawn = [];
    let thisRareCount = 0;
    for (let n = 0; n < drawCount; n++) {
      let probabilitySum = 0;
      const result = Math.random() * 100;
      for (const relic of probabilities) {
        probabilitySum += relic.probability;
        if (result < probabilitySum) {
          drawn.push(relic.relicId);
          if (relic.rarity >= guaranteedRarity) {
            thisRareCount++;
          }
          break;
        }
      }
    }
    if (thisRareCount >= guaranteedCount) {
      break;
    }
  }
  return drawn;
}

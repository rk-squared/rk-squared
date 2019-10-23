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

/**
 * Parameters for a single pull on a relic draw banner.
 *
 * Note that this structure is somewhat simplified.  We don't attempt to
 * handle cases like the Acolyte Archives (only 1 rare) or the 8 relic gift
 * draw from the spring 2019 festival (one 6 star and 7 5 stars).
 */
export interface RelicDrawPullParams {
  /** Number of items pulled with each draw (usually 11) */
  drawCount: number;
  /** Guaranteed rarity (usually 5 or 6) */
  guaranteedRarity: number;
  /** Guaranteed count (e.g., at least 1 5*) */
  guaranteedCount: number;
}

interface RelicDrawBannerChances {
  expectedValue: number;
  desiredChance: number;
}

/**
 * Combinations formula - "n choose k" is n! / (k! * (n - k)!).
 */
export function combinations(n: number, k: number): number {
  const smaller = Math.min(k, n - k);
  const larger = Math.max(k, n - k);
  let result = 1;
  for (let i = n; i > larger; i--) {
    result *= i;
  }
  for (let i = 1; i <= smaller; i++) {
    result /= i;
  }
  return result;
}

/**
 * Analysis of probabilities, following proposal 5 on Reddit.
 *
 * @param drawCount - Number of items in this banner (usually 11)
 * @param rareChancePerRelic - Total chance of getting a relic of guaranteed
 *    rarity (e.g., 0.1404)
 * @param desiredChancePerRelic - Total chance of getting something desirable
 *    out of the rare relics (e.g., 0.05)
 * @param desiredNonRareChancePerRelic - Total chance of getting something
 *    desirable out of the non-rare relics.  Usually zero; this is only
 *    relevant for draws like the x40 gift that guarantees 2 6 star relics.
 */
export function chanceOfDesiredDrawProp5(
  { drawCount, guaranteedCount }: RelicDrawPullParams,
  rareChancePerRelic: number,
  desiredChancePerRelic: number,
  desiredNonRareChancePerRelic: number = 0,
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
  const z = desiredNonRareChancePerRelic;

  let totalEv = 0;
  let totalDesiredChance = 0;
  let chanceOfReroll = 0;
  for (let i = 0; i <= n; i++) {
    // Number of ways we could get i rares and n - i non-rares.
    const combinationsForThisOutcome = combinations(n, i);
    // Chance of getting i rares and n - i non-rares
    const chanceForThisOutcome = (1 - x) ** (n - i) * x ** i * combinationsForThisOutcome;

    if (i < guaranteedCount) {
      chanceOfReroll += chanceForThisOutcome;
    } else {
      // Expected value for this arrangement of getting i rares.
      const evForThisOutcome = (y / x) * i + (z / (1 - x)) * (n - i);

      const undesiredChanceForThisOutcome = ((x - y) / x) ** i * ((1 - x - z) / (1 - x)) ** (n - i);

      totalEv += chanceForThisOutcome * evForThisOutcome;
      totalDesiredChance += chanceForThisOutcome * (1 - undesiredChanceForThisOutcome);
    }
  }

  const r = chanceOfReroll;

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
  { drawCount, guaranteedCount }: RelicDrawPullParams,
  rareChancePerRelic: number,
  desiredChancePerRelic: number,
  desiredNonRareChancePerRelic: number,
  iterations: number,
): RelicDrawBannerChances {
  let totalCount = 0;
  let atLeast1Count = 0;
  for (let i = 0; i < iterations; i++) {
    let thisRareCount = 0;
    let thisDesiredCount = 0;
    while (thisRareCount < guaranteedCount) {
      for (let j = 0; j < drawCount; j++) {
        const result = Math.random();
        if (result < desiredChancePerRelic) {
          thisDesiredCount++;
        }
        if (result < rareChancePerRelic) {
          thisRareCount++;
        }
        if (
          result >= rareChancePerRelic &&
          result < rareChancePerRelic + desiredNonRareChancePerRelic
        ) {
          thisDesiredCount++;
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

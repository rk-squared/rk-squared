/**
 * @file
 *
 * Calculations of relic draw banner probabilities.
 *
 * See https://www.reddit.com/r/FFRecordKeeper/comments/83l3jd/analysis_of_fuitads_gacha_data/
 */

/**
 * Analysis of probabilities, following proposal 5 on Reddit.
 *
 * @param drawCount      Number of items in this banner (usually 11)
 * @param rareChance     Total chance of getting a 5* or 6* (e.g., 0.1404)
 * @param desiredChance  Total chance of getting something desirable (e.g., 0.05)
 */
export function chanceOfDesiredDrawProp5(
  drawCount: number,
  rareChance: number,
  desiredChance: number,
) {
  // If x is the percentage of getting a 5* or better
  // and y is the percentage of getting what you care about,
  // then an 11 draw has the following possible outcomes:
  // - x chance of getting rare plus 10 * x rares
  // - (1 - x) * x chance of getting rare plus 9 * x rares
  // - (1 - x) ^ 2 * x chance of getting rare + 8 * x rares
  // - etc.
  // - (1 - x) ^ 11 chance of getting nothing and re-rolling
  const n = drawCount;
  const x = rareChance;
  const y = desiredChance;

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
    ev: totalEv / (1 - r),
    desiredChance: totalDesiredChance / (1 - r),
  };
}

/**
 * x = percentage of 5* or better
 * y = percentage of getting what you care about
 *
 * on an 11 draw:
 *
 * x chance of getting 11y
 * (1-x)*x chance of getting 10y
 * (1-x)^2*x chance of getting 9y
 * etc.
 *
 * (1-x)^11 chance of going to the next term
 *
 * Sum of an infinite geometric series is a/(1-r)
 */
export function chanceOfDesiredDraw(
  drawCount: number,
  rareChance: number,
  desiredChance: number,
): number {
  const n = drawCount;
  const x = rareChance;
  const y = desiredChance;

  let a = 0;
  for (let i = 0; i < n - 1; i++) {
    // Chance of not getting a rare for the preceding i draws then getting a
    // rare on this draw.
    const thisChance = (1 - x) ** i * x;

    // Expected value for this arrangement of not getting a rare for the
    // preceding i draws then getting a rare on this draw.
    const thisValue = y / x + (n - 1 - i) * y;

    a += thisChance * thisValue;
  }

  const chanceOfNone = (1 - x) ** n;
  const r = chanceOfNone;

  return a / (1 - r);
}

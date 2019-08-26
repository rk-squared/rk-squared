import * as moment from 'moment';

/**
 * Seconds since the epoch
 */
export type TimeT = number;

/**
 * Far-future timestamps indicate that something never closes - but different
 * worlds may have different far-future timestamps.  (E.g., the FF15 torment's
 * is a bit before the FF13 torment's.)
 *
 * 2000000000 was chosen semi-arbitrarily; it corresponds to May 17, 2033.
 */
export const FAR_FUTURE = 2e9;

export const formatTimeT = (t: TimeT) => moment.unix(t).format('M/D/Y LT');
export const formatTimeTNoYear = (t: TimeT) => moment.unix(t).format('M/D LT');

/**
 * Returns whether an item is not yet open (-1), open (0), or now closed (1).
 */
export function isClosed(
  { openedAt, closedAt }: { openedAt: number; closedAt: number },
  currentTime: number,
): -1 | 0 | 1 {
  if (openedAt > currentTime / 1000) {
    return -1;
  } else if (closedAt < currentTime / 1000 + 60) {
    return 1;
  } else {
    return 0;
  }
}

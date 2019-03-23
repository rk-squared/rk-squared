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

export const formatTimeT = (t: TimeT) => moment.unix(t).format('l LT');

import * as React from 'react';
import { Link } from 'react-router-dom';

import classNames from 'classnames';

import {
  isGroup,
  RelicDrawBannerDetails,
  RelicDrawBannerOrGroup,
  RelicDrawGroupDetails,
} from '../../selectors/relicDraws';
import { pluralize } from '../../utils/textUtils';
import { FAR_FUTURE, formatTimeT, formatTimeTNoYear, isClosed } from '../../utils/timeUtils';
import { Mythril } from '../shared/Mythril';

const styles = require('./RelicDrawBannerList.scss');

interface Props {
  group?: RelicDrawGroupDetails;
  details: RelicDrawBannerOrGroup[];
  isAnonymous?: boolean;
  currentTime?: number;
  groupLink: (group: string) => string;
  bannerLink: (bannerId: number) => string;
}

interface RelicLinkProps<T> {
  details: T;
  to: string;
  isAnonymous?: boolean;
  currentTime?: number;
}

/**
 * Should we show this item?  It may be interesting to see the contents of even
 * one-time banners, but don't clutter the list with permanent one-time banners.
 */
const shouldShow = (details: RelicDrawBannerOrGroup) =>
  details.canPull || details.canSelect || details.closedAt < FAR_FUTURE;

function formatDupeCount(details: RelicDrawBannerDetails) {
  if (details.dupeCount != null && details.totalCount) {
    return `${details.dupeCount} / ${details.totalCount} ${pluralize(details.dupeCount, 'dupe')}`;
  } else {
    return undefined;
  }
}

function formatTotalCount(details: RelicDrawBannerDetails) {
  if (details.totalCount) {
    return `${details.totalCount} ${pluralize(details.totalCount, 'relic')}`;
  } else {
    return undefined;
  }
}

function formatAvailableCount(details: RelicDrawBannerDetails) {
  const result = formatDupeCount(details) || formatTotalCount(details);
  if (result && !details.canPull) {
    return result + ' (unavailable)';
  } else {
    return result;
  }
}

const RelicDrawGroupLink = ({
  details,
  to,
  isAnonymous,
  currentTime,
}: RelicLinkProps<RelicDrawGroupDetails>) => {
  const count = isAnonymous ? details.bannerCount : details.canPullOrSelectCount;
  const countText = isAnonymous ? '' : ' available';
  return (
    <div className={styles.component}>
      <Link to={to}>
        <img className={styles.image} src={details.imageUrl} />
      </Link>
      <div className={styles.details}>
        <span className={styles.count}>{count + ' ' + pluralize(count, 'banner') + countText}</span>
        {currentTime != null && (
          <span className={styles.openedClosedAt}>{openedClosedAt(details, currentTime)}</span>
        )}
      </div>
    </div>
  );
};

function openedClosedAt(details: RelicDrawBannerOrGroup, currentTime: number) {
  const closed = isClosed(details, currentTime);
  if (!closed && details.closedAt >= FAR_FUTURE) {
    return null;
  } else if (closed < 0) {
    if (details.closedAt < FAR_FUTURE) {
      return formatTimeTNoYear(details.openedAt) + ' - ' + formatTimeT(details.closedAt);
    } else {
      return 'opens ' + formatTimeT(details.openedAt);
    }
  } else if (!closed) {
    return 'ends ' + formatTimeT(details.closedAt);
  } else {
    return 'ended ' + formatTimeT(details.closedAt);
  }
}

const RelicDrawBannerLink = ({
  details,
  to,
  isAnonymous,
  currentTime,
}: RelicLinkProps<RelicDrawBannerDetails>) => {
  const count = isAnonymous ? formatTotalCount(details) : formatAvailableCount(details);

  let mythrilCost = details.cost && details.cost.mythrilCost ? details.cost.mythrilCost : null;
  if (isAnonymous && details.cost && details.cost.firstMythrilCost) {
    mythrilCost = details.cost.firstMythrilCost;
  }

  return (
    <div className={styles.component}>
      <Link to={to}>
        <img className={styles.image} src={details.imageUrl} />
      </Link>
      <div className={styles.details}>
        <span
          className={classNames(styles.count, { ['text-muted']: !isAnonymous && !details.canPull })}
        >
          {count}
          <Mythril
            className={classNames(styles.mythrilCost, {
              ['invisible']: !mythrilCost || !details.canPull,
            })}
          >
            {mythrilCost}
          </Mythril>
        </span>
        {currentTime != null && (
          <span className={styles.openedClosedAt}>{openedClosedAt(details, currentTime)}</span>
        )}
      </div>
    </div>
  );
};

/**
 * A list of relic draw banners and/or groups.  Can show the top-level list or
 * a single group.
 */
export class RelicDrawBannerList extends React.PureComponent<Props> {
  render() {
    const { details, isAnonymous, currentTime, groupLink, bannerLink } = this.props;
    return (
      <>
        {details
          .filter(d => isAnonymous || shouldShow(d))
          .map((d, i) =>
            isGroup(d) ? (
              <RelicDrawGroupLink
                details={d}
                isAnonymous={isAnonymous}
                currentTime={currentTime}
                key={i}
                to={groupLink(d.groupName)}
              />
            ) : (
              <RelicDrawBannerLink
                details={d}
                isAnonymous={isAnonymous}
                currentTime={currentTime}
                key={i}
                to={bannerLink(d.id)}
              />
            ),
          )}
      </>
    );
  }
}

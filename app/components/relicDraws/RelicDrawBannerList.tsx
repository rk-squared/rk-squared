import * as React from 'react';
import { Link } from 'react-router-dom';
import * as ReactTooltip from 'react-tooltip';

import classNames from 'classnames';

import { RelicDrawProbabilities } from '../../actions/relicDraws';
import {
  isGroup,
  RelicDrawBannerDetails,
  RelicDrawBannerOrGroup,
  RelicDrawGroupDetails,
} from '../../selectors/relicDraws';
import { pluralize } from '../../utils/textUtils';
import { FAR_FUTURE, formatTimeT, formatTimeTNoYear, isClosed } from '../../utils/timeUtils';
import { Mythril } from '../shared/Mythril';
import { getRelicChanceDetails } from './RelicChances';
import { RelicWantCount } from './RelicWantCount';

const styles = require('./RelicDrawBannerList.scss');

interface Props {
  group?: RelicDrawGroupDetails;
  details: RelicDrawBannerOrGroup[];
  isAnonymous?: boolean;
  currentTime?: number;
  groupLink: (group: string) => string;
  bannerLink: (bannerId: number) => string;
  want?: { [relicId: number]: boolean };
  probabilities: {
    [bannerId: string]: RelicDrawProbabilities;
  };
}

interface RelicLinkProps<T> {
  details: T;
  to: string;
  isAnonymous?: boolean;
  currentTime?: number;
  want?: { [relicId: number]: boolean };
  probabilities?: RelicDrawProbabilities;
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
  want,
  probabilities,
}: RelicLinkProps<RelicDrawBannerDetails>) => {
  const closed = currentTime ? isClosed(details, currentTime) : false;
  const count = isAnonymous ? formatTotalCount(details) : formatAvailableCount(details);
  const userCannotPull = !isAnonymous && !details.canPull;

  let mythrilCost = details.cost && details.cost.mythrilCost ? details.cost.mythrilCost : null;
  if (isAnonymous && details.cost && details.cost.firstMythrilCost) {
    mythrilCost = details.cost.firstMythrilCost;
  }

  const tooltipId = `tooltip-relic-banner-${details.id}`;
  let desiredChance: number | undefined;
  let desiredFeaturedCount: number | null | undefined;
  let desiredCount: number | undefined;
  if (want && probabilities) {
    const chanceDetails = getRelicChanceDetails(details, probabilities, want);
    if (chanceDetails && chanceDetails.desiredCount > 0) {
      desiredChance = chanceDetails.desiredChance;
      desiredFeaturedCount = chanceDetails.desiredFeaturedCount;
      desiredCount = chanceDetails.desiredCount;
    }
  }

  return (
    <div
      className={classNames(styles.component, {
        [styles.showAsClosed]:
          closed === 1 || (closed !== -1 && userCannotPull && !details.canSelect),
      })}
    >
      <Link to={to}>
        <img className={styles.image} src={details.imageUrl} />
      </Link>
      <div className={styles.details}>
        <span
          className={classNames(styles.count, {
            ['text-muted']: closed || userCannotPull,
          })}
        >
          {count}
          <Mythril
            className={classNames(styles.mythrilCost, {
              ['invisible']: !mythrilCost || userCannotPull,
            })}
          >
            {mythrilCost}
          </Mythril>
          {desiredChance && (
            <span className={styles.desiredChance} data-tip={true} data-for={tooltipId}>
              {(desiredChance * 100).toFixed(0)}%
            </span>
          )}
        </span>
        {currentTime != null && (
          <span className={styles.openedClosedAt}>{openedClosedAt(details, currentTime)}</span>
        )}
      </div>
      {desiredChance && desiredFeaturedCount != null && desiredCount != null && (
        <ReactTooltip id={tooltipId}>
          Chance of <RelicWantCount featuredCount={desiredFeaturedCount} count={desiredCount} /> on
          a single pull. Click the banner for details.
        </ReactTooltip>
      )}
    </div>
  );
};

/**
 * A list of relic draw banners and/or groups.  Can show the top-level list or
 * a single group.
 */
export class RelicDrawBannerList extends React.PureComponent<Props> {
  render() {
    const {
      details,
      isAnonymous,
      currentTime,
      groupLink,
      bannerLink,
      want,
      probabilities,
    } = this.props;
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
                want={want}
                probabilities={probabilities[d.id]}
              />
            ),
          )}
      </>
    );
  }
}

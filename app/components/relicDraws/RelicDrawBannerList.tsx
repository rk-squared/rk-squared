import * as React from 'react';
import { Link } from 'react-router-dom';

import {
  isGroup,
  RelicDrawBannerDetails,
  RelicDrawBannerOrGroup,
  RelicDrawGroupDetails,
} from '../../selectors/relicDraws';
import { pluralize } from '../../utils/textUtils';
import { FAR_FUTURE, formatTimeT } from '../../utils/timeUtils';

const styles = require('./RelicDrawBannerList.scss');

interface Props {
  group?: RelicDrawGroupDetails;
  details: RelicDrawBannerOrGroup[];
  isAnonymous?: boolean;
  groupLink: (group: string) => string;
  bannerLink: (bannerId: number) => string;
}

interface RelicLinkProps<T> {
  details: T;
  to: string;
  isAnonymous?: boolean;
}

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
  if (!details.canPull) {
    return undefined;
  } else {
    return formatDupeCount(details) || formatTotalCount(details);
  }
}

const RelicDrawGroupLink = ({
  details,
  to,
  isAnonymous,
}: RelicLinkProps<RelicDrawGroupDetails>) => {
  const count = isAnonymous ? details.bannerCount : details.canPullOrSelectCount;
  return (
    <div>
      <Link to={to}>
        <img className={styles.image} src={details.imageUrl} />
      </Link>
      <div className={styles.details}>
        {count} {pluralize(count, 'banner')}{' '}
      </div>
    </div>
  );
};

const RelicDrawBannerLink = ({
  details,
  to,
  isAnonymous,
}: RelicLinkProps<RelicDrawBannerDetails>) => {
  const count = isAnonymous ? formatTotalCount(details) : formatAvailableCount(details);
  return (
    <div className={styles.component}>
      <Link to={to}>
        <img className={styles.image} src={details.imageUrl} />
      </Link>
      <div className={styles.details}>
        <span className={styles.count}>{count}</span>
        {details.closedAt < FAR_FUTURE && (
          <span className={styles.closedAt}>ends {formatTimeT(details.closedAt)}</span>
        )}
      </div>
    </div>
  );
};

export class RelicDrawBannerList extends React.PureComponent<Props> {
  render() {
    const { details, isAnonymous, groupLink, bannerLink } = this.props;
    return (
      <>
        {details
          .filter(d => isAnonymous || d.canPull || d.canSelect)
          .map((d, i) =>
            isGroup(d) ? (
              <RelicDrawGroupLink
                details={d}
                isAnonymous={isAnonymous}
                key={i}
                to={groupLink(d.groupName)}
              />
            ) : (
              <RelicDrawBannerLink
                details={d}
                isAnonymous={isAnonymous}
                key={i}
                to={bannerLink(d.id)}
              />
            ),
          )}
      </>
    );
  }
}

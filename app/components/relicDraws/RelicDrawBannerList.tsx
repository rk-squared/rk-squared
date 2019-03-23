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
  groupLink: (group: string) => string;
  bannerLink: (bannerId: number) => string;
}

function formatDupeCount(details: RelicDrawBannerDetails) {
  if (details.canPull && details.dupeCount != null && details.totalCount) {
    return `${details.dupeCount} / ${details.totalCount} ${pluralize(details.dupeCount, 'dupe')}`;
  } else {
    return undefined;
  }
}

function formatTotalCount(details: RelicDrawBannerDetails) {
  if (details.canPull && details.dupeCount == null && details.totalCount) {
    return `${details.totalCount} ${pluralize(details.totalCount, 'relic')}`;
  } else {
    return undefined;
  }
}

const RelicDrawGroupLink = ({ details, to }: { details: RelicDrawGroupDetails; to: string }) => {
  return (
    <div>
      <Link to={to}>
        <img className={styles.image} src={details.imageUrl} />
      </Link>
      <div className={styles.details}>
        {details.canPullOrSelectCount} {pluralize(details.canPullOrSelectCount, 'banner')}{' '}
      </div>
    </div>
  );
};

const RelicDrawBannerLink = ({ details, to }: { details: RelicDrawBannerDetails; to: string }) => {
  return (
    <div className={styles.component}>
      <Link to={to}>
        <img className={styles.image} src={details.imageUrl} />
      </Link>
      <div className={styles.details}>
        <span className={styles.count}>
          {formatDupeCount(details) || formatTotalCount(details)}
        </span>
        {details.closedAt < FAR_FUTURE && (
          <span className={styles.closedAt}>ends {formatTimeT(details.closedAt)}</span>
        )}
      </div>
    </div>
  );
};

export class RelicDrawBannerList extends React.PureComponent<Props> {
  render() {
    const { details, groupLink, bannerLink } = this.props;
    return (
      <>
        {details
          /*.filter(d => d.canPull || d.canSelect)*/
          .map((d, i) =>
            isGroup(d) ? (
              <RelicDrawGroupLink details={d} key={i} to={groupLink(d.groupName)} />
            ) : (
              <RelicDrawBannerLink details={d} key={i} to={bannerLink(d.id)} />
            ),
          )}
      </>
    );
  }
}

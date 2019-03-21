import * as React from 'react';
import { Link } from 'react-router-dom';

import {
  isGroup,
  RelicDrawBannerDetails,
  RelicDrawBannerOrGroup,
  RelicDrawGroupDetails,
} from '../../selectors/relicDraws';
import { pluralize } from '../../utils/textUtils';

const styles = require('./RelicDrawList.scss');

interface Props {
  group?: RelicDrawGroupDetails;
  details: RelicDrawBannerOrGroup[];
  groupLink: (group: string) => string;
  bannerLink: (bannerId: number) => string;
}

const RelicDrawGroupLink = ({ details, to }: { details: RelicDrawGroupDetails; to: string }) => {
  return (
    <div>
      <Link to={to}>
        <img className={styles.detail} src={details.imageUrl} />
      </Link>
      <small>
        {details.canPullOrSelectCount} {pluralize(details.canPullOrSelectCount, 'banner')}{' '}
      </small>
    </div>
  );
};

const RelicDrawBannerLink = ({ details, to }: { details: RelicDrawBannerDetails; to: string }) => {
  return (
    <div>
      <Link to={to}>
        <img className={styles.detail} src={details.imageUrl} />
      </Link>
      {details.canPull && details.dupeCount != null && !!details.totalCount && (
        <small>
          {details.dupeCount} / {details.totalCount} {pluralize(details.dupeCount, 'dupe')}
        </small>
      )}
      {details.canPull && details.dupeCount == null && !!details.totalCount && (
        <small>
          {details.totalCount} {pluralize(details.totalCount, 'relic')}
        </small>
      )}
    </div>
  );
};

export class RelicDrawList extends React.PureComponent<Props> {
  render() {
    const { details, groupLink, bannerLink } = this.props;
    return (
      <>
        {details
          .filter(d => d.canPull || d.canSelect)
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

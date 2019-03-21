import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';

import { IState } from '../reducers';
import {
  getBannersAndGroups,
  isGroup,
  RelicDrawBannerOrGroup,
  RelicDrawBannersAndGroups,
} from '../selectors/relicDraws';
import { pluralize } from '../utils/textUtils';
import { Page } from './Page';

interface Props {
  bannersAndGroups: RelicDrawBannersAndGroups;
  group?: string;
}

const RelicDrawLink = ({ details }: { details: RelicDrawBannerOrGroup }) => {
  if (isGroup(details)) {
    return (
      <div>
        <img src={details.imageUrl} />
      </div>
    );
  }
  return (
    <div>
      <img src={details.imageUrl} />
      {details.dupeCount != null && details.totalCount != null && (
        <small>
          {details.dupeCount} / {details.totalCount} {pluralize(details.dupeCount, 'dupe')}
        </small>
      )}
      {details.dupeCount == null && details.totalCount && (
        <small>
          {details.totalCount} {pluralize(details.totalCount, 'relic')}
        </small>
      )}
    </div>
  );
};

export class RelicDrawsPage extends React.Component<Props & RouteComponentProps> {
  renderContents() {
    const { bannersAndGroups, group } = this.props;
    const details = bannersAndGroups['' + group];
    if (!details) {
      return (
        <>
          <p>Relic draw details are not available, or this banner selection has expired.</p>
          <p>Please restart FFRK then go under Relic Draws.</p>
        </>
      );
    }
    return (
      <>
        {details.map((d, i) => (
          <RelicDrawLink details={d} key={i} />
        ))}
      </>
    );
  }

  render() {
    return <Page title="Relic Draws">{this.renderContents()}</Page>;
  }
}

export default connect((state: IState) => ({
  bannersAndGroups: getBannersAndGroups(state),
}))(RelicDrawsPage);

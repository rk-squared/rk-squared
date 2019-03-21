import * as React from 'react';
import { connect } from 'react-redux';
import { Route, RouteComponentProps } from 'react-router';

import { BadRelicDrawMessage } from '../components/relicDraws/BadRelicDrawMessage';
import { RelicDrawList } from '../components/relicDraws/RelicDrawList';
import { IState } from '../reducers';
import { getBannersAndGroups, RelicDrawBannersAndGroups } from '../selectors/relicDraws';
import { Page } from './Page';
import RelicDrawGroupPage from './RelicDrawGroupPage';

interface Props {
  bannersAndGroups: RelicDrawBannersAndGroups;
}

export class RelicDrawsPage extends React.PureComponent<Props & RouteComponentProps> {
  groupLink = (group: string) => this.props.match.url + '/groups/' + group;
  bannerLink = (banner: string | number) => this.props.match.url + '/banners/' + banner;

  renderContents() {
    const { bannersAndGroups, match } = this.props;
    const details = bannersAndGroups['undefined'];
    if (!details) {
      return <BadRelicDrawMessage />;
    }
    const links = {
      bannerLink: this.bannerLink,
      groupLink: this.groupLink,
    };
    return (
      <>
        <Route
          path={this.groupLink(':group')}
          render={(props: RouteComponentProps<any>) => (
            <RelicDrawGroupPage {...props} {...links} backLink={match.url} />
          )}
        />
        <Route
          exact
          path={match.url}
          render={() => <RelicDrawList details={details} {...links} />}
        />
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

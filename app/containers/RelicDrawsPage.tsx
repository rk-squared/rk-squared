import * as React from 'react';
import { connect } from 'react-redux';
import { Route, RouteComponentProps } from 'react-router';

import { BadRelicDrawMessage } from '../components/relicDraws/BadRelicDrawMessage';
import { RelicDrawBannerList } from '../components/relicDraws/RelicDrawBannerList';
import { IState } from '../reducers';
import { getBannersAndGroups, RelicDrawBannersAndGroups } from '../selectors/relicDraws';
import { Page } from './Page';
import RelicDrawBannerPage from './RelicDrawBannerPage';
import RelicDrawGroupPage from './RelicDrawGroupPage';

interface Props {
  bannersAndGroups: RelicDrawBannersAndGroups;
}

export class RelicDrawsPage extends React.PureComponent<Props & RouteComponentProps> {
  groupLink = (group: string) => this.props.match.url + '/group-' + group;
  bannerLink = (banner: string | number) => this.props.match.url + '/banner' + banner;
  groupBannerLink = (group: string, banner: string | number) =>
    this.props.match.url + '/group-' + group + '/banner' + banner;

  renderContents() {
    const { bannersAndGroups, match } = this.props;
    const details = bannersAndGroups['undefined'];
    if (!details) {
      return <BadRelicDrawMessage />;
    }
    return (
      <>
        {/* HACK: Support one layer of nesting (group -> banner) */}
        <Route
          path={this.groupBannerLink(':group', ':banner')}
          render={(props: RouteComponentProps<any>) => (
            <RelicDrawBannerPage {...props} backLink={this.groupLink(props.match.params.group)} />
          )}
        />

        <Route
          exact
          path={this.groupLink(':group')}
          render={(props: RouteComponentProps<any>) => (
            <RelicDrawGroupPage
              {...props}
              bannerLink={(banner: string | number) =>
                this.groupBannerLink(props.match.params.group, banner)
              }
              groupLink={this.groupLink}
              backLink={match.url}
            />
          )}
        />
        <Route
          path={this.bannerLink(':banner')}
          render={(props: RouteComponentProps<any>) => (
            <RelicDrawBannerPage {...props} backLink={match.url} />
          )}
        />

        <Route
          exact
          path={match.url}
          render={() => (
            <RelicDrawBannerList
              details={details}
              bannerLink={this.bannerLink}
              groupLink={this.groupLink}
            />
          )}
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

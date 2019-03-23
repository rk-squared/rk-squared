import * as React from 'react';
import { connect } from 'react-redux';
import { Route, RouteComponentProps } from 'react-router';
import { Dispatch } from 'redux';

import { loadBanners } from '../actions/relicDraws';
import { BadRelicDrawMessage } from '../components/relicDraws/BadRelicDrawMessage';
import { RelicDrawBannerList } from '../components/relicDraws/RelicDrawBannerList';
import LoadMissingPrompt from '../components/shared/LoadMissingPrompt';
import { IState } from '../reducers';
import { progressKey } from '../sagas/loadBanners';
import {
  getBannersAndGroups,
  getMissingBanners,
  RelicDrawBannersAndGroups,
} from '../selectors/relicDraws';
import { Page } from './Page';
import RelicDrawBannerPage from './RelicDrawBannerPage';
import RelicDrawGroupPage from './RelicDrawGroupPage';

interface Props {
  bannersAndGroups: RelicDrawBannersAndGroups;
  missingBanners: number[];
  dispatch: Dispatch;
}

export class RelicDrawsPage extends React.PureComponent<Props & RouteComponentProps> {
  groupLink = (group: string) => this.props.match.url + '/group-' + group;
  bannerLink = (banner: string | number) => this.props.match.url + '/banner' + banner;
  groupBannerLink = (group: string, banner: string | number) =>
    this.props.match.url + '/group-' + group + '/banner' + banner;

  handleLoad = () => {
    const { missingBanners, dispatch } = this.props;
    dispatch(loadBanners(missingBanners));
  };

  renderContents() {
    const { bannersAndGroups, missingBanners, match } = this.props;
    const details = bannersAndGroups['undefined'];
    if (!details) {
      return <BadRelicDrawMessage />;
    }
    const isAnonymous = !process.env.IS_ELECTRON;
    return (
      <>
        <LoadMissingPrompt
          missingCount={missingBanners.length}
          missingText="Details for %s have not been loaded."
          countText="banner"
          loadingText="Loading banner details"
          onLoad={this.handleLoad}
          progressKey={progressKey}
        />

        {/* HACK: Support one layer of nesting (group -> banner) */}
        <Route
          path={this.groupBannerLink(':group', ':banner')}
          render={(props: RouteComponentProps<any>) => (
            <RelicDrawBannerPage
              {...props}
              isAnonymous={isAnonymous}
              backLink={this.groupLink(props.match.params.group)}
            />
          )}
        />

        <Route
          exact
          path={this.groupLink(':group')}
          render={(props: RouteComponentProps<any>) => (
            <RelicDrawGroupPage
              {...props}
              isAnonymous={isAnonymous}
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
            <RelicDrawBannerPage {...props} isAnonymous={isAnonymous} backLink={match.url} />
          )}
        />

        <Route
          exact
          path={match.url}
          render={() => (
            <RelicDrawBannerList
              details={details}
              isAnonymous={isAnonymous}
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
  missingBanners: getMissingBanners(state),
}))(RelicDrawsPage);

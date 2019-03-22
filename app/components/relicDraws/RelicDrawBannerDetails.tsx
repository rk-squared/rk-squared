import * as React from 'react';

import * as _ from 'lodash';

import {
  getOffBannerRelics,
  RelicDrawBanner,
  RelicDrawProbabilities,
} from '../../actions/relicDraws';
import RelicDrawBannerTable from './RelicDrawBannerTable';

interface Props {
  banner: RelicDrawBanner;
  probabilities?: RelicDrawProbabilities;
}

export class RelicDrawBannerDetails extends React.PureComponent<Props> {
  renderFeatured() {
    const { banner, probabilities } = this.props;
    if (!banner.bannerRelics || !banner.bannerRelics.length) {
      return null;
    }
    return (
      <RelicDrawBannerTable
        title={'Featured Relics'}
        relics={banner.bannerRelics}
        probabilities={probabilities}
      />
    );
  }

  renderAll() {
    const { banner, probabilities } = this.props;
    if ((banner.bannerRelics && banner.bannerRelics.length) || !probabilities) {
      return null;
    }
    return (
      <RelicDrawBannerTable
        title={'All Relics'}
        relics={_.keys(probabilities.byRelic).map(i => +i)}
        probabilities={probabilities}
      />
    );
  }

  renderOffBanner() {
    const { banner, probabilities } = this.props;
    const offBanner =
      banner.bannerRelics && banner.bannerRelics.length && probabilities
        ? getOffBannerRelics(banner, probabilities)
        : undefined;
    if (!offBanner) {
      return null;
    }
    return (
      <RelicDrawBannerTable title={'Off-Banner'} relics={offBanner} probabilities={probabilities} />
    );
  }

  renderFallback() {
    const { banner, probabilities } = this.props;
    if ((banner.bannerRelics && banner.bannerRelics.length) || probabilities) {
      return null;
    }
    return (
      <tr>
        <td>No details are available for this banner.</td>
      </tr>
    );
  }

  render() {
    return (
      <>
        {this.renderFeatured()}
        {this.renderAll()}
        {this.renderOffBanner()}
        {this.renderFallback()}
      </>
    );
  }
}

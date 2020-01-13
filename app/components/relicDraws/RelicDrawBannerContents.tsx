import * as React from 'react';

import * as _ from 'lodash';

import { getOffBannerRelics, RelicDrawProbabilities } from '../../actions/relicDraws';
import { enlir, soulBreakTierOrder } from '../../data/enlir';
import { RelicDrawBannerDetails } from '../../selectors/relicDraws';
import { isAllSame } from '../../utils/typeUtils';
import RelicDrawBannerTable from './RelicDrawBannerTable';
import RelicSelectionPrefsMenu from './RelicSelectionPrefsMenu';

interface Props {
  banner: RelicDrawBannerDetails;
  probabilities?: RelicDrawProbabilities;
  isAnonymous?: boolean;
  visibleExchangeShopSelections?: Set<number>;
}

function sortRelics(relicIds: number[]) {
  return _.sortBy(relicIds, [
    (i: number) =>
      enlir.relics[i].character ? enlir.charactersByName[enlir.relics[i].character!].id : 0,
    (i: number) =>
      enlir.relicSoulBreaks[i] ? -soulBreakTierOrder[enlir.relicSoulBreaks[i].tier] : 0,
    (i: number) =>
      enlir.relicSoulBreaks[i]
        ? -enlir.relicSoulBreaks[i].id
        : enlir.relicLegendMateria[i]
        ? -enlir.relicLegendMateria[i].id
        : 0,
  ]);
}

/**
 * The contents of a single relic draw banner, including available selections,
 * featured relics, off-banner relics, etc.
 */
export class RelicDrawBannerContents extends React.PureComponent<Props> {
  renderSelections() {
    const { banner, isAnonymous, visibleExchangeShopSelections } = this.props;
    if (!banner.selections || !banner.selections.length) {
      return null;
    }
    return (
      <RelicDrawBannerTable
        title={'Available Selections'}
        relics={banner.selections}
        isAnonymous={isAnonymous}
        groupBySeries={true}
        allowSelect={true}
        includeAvailability={true}
        prefsMenu={() => <RelicSelectionPrefsMenu />}
        filter={(id: number) =>
          !visibleExchangeShopSelections || visibleExchangeShopSelections.has(id)
        }
      />
    );
  }

  renderFeatured() {
    const { banner, probabilities, isAnonymous } = this.props;
    if (!banner.bannerRelics || !banner.bannerRelics.length) {
      return null;
    }
    return (
      <RelicDrawBannerTable
        title={'Featured Relics'}
        relics={banner.bannerRelics}
        probabilities={probabilities}
        isAnonymous={isAnonymous}
        allowSelect={true}
      />
    );
  }

  renderAll() {
    const { banner, probabilities, isAnonymous } = this.props;
    if ((banner.bannerRelics && banner.bannerRelics.length) || !probabilities) {
      return null;
    }
    const relics = _.keys(probabilities.byRelic).map(i => +i);
    const hasSelections = banner.selections != null && banner.selections.length !== 0;
    const groupBySeries = !isAllSame(relics, i => enlir.relics[i].realm);
    return (
      <RelicDrawBannerTable
        title={'All Relics'}
        relics={sortRelics(relics)}
        probabilities={probabilities}
        isAnonymous={isAnonymous}
        allowCollapse={hasSelections}
        allowSelect={true}
        groupBySeries={groupBySeries}
      />
    );
  }

  renderOffBanner() {
    const { banner, probabilities, isAnonymous } = this.props;
    const offBanner =
      banner.bannerRelics && banner.bannerRelics.length && probabilities
        ? sortRelics(getOffBannerRelics(banner, probabilities))
        : undefined;
    if (!offBanner || !offBanner.length) {
      return null;
    }
    return (
      <RelicDrawBannerTable
        title={'Off-Banner'}
        relics={offBanner}
        probabilities={probabilities}
        isAnonymous={isAnonymous}
        allowCollapse={true}
        allowSelect={true}
      />
    );
  }

  renderFallback() {
    const { banner, probabilities } = this.props;
    if ((banner.bannerRelics && banner.bannerRelics.length) || probabilities) {
      return null;
    }
    return <div>No details are available for this banner.</div>;
  }

  render() {
    return (
      <>
        {this.renderSelections()}
        {this.renderFeatured()}
        {this.renderAll()}
        {this.renderOffBanner()}
        {this.renderFallback()}
      </>
    );
  }
}

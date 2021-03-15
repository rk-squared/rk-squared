import * as React from 'react';
import { connect } from 'react-redux';

import { IconProp } from '@fortawesome/fontawesome-svg-core';
import * as _ from 'lodash';
import * as ReactTooltip from 'react-tooltip';

import {
  clearWantedRelics,
  getNormalBannerPullParams,
  RelicDrawProbabilities,
} from '../../actions/relicDraws';
import { enlir } from '../../data/enlir';
import { chanceOfDesiredDrawProp5, MaxRarity, StandardMythrilCost } from '../../data/probabilities';
import { IState } from '../../reducers';
import { RelicDrawBannerDetails } from '../../selectors/relicDraws';
import { pluralize } from '../../utils/textUtils';
import { MinableCard, MinableCardIcon } from '../common/MinableCard';
import { Mythril } from '../shared/Mythril';
import { RelicDrawModalLink } from './RelicDrawModalLink';
import { RelicWantCount } from './RelicWantCount';

const styles = require('./RelicChances.module.scss');

interface Props {
  banner: RelicDrawBannerDetails;
  probabilities: RelicDrawProbabilities;
  isAnonymous?: boolean;
  className?: string;

  want?: { [relicId: number]: boolean };
  onClear?: (relicIds: number[]) => void;
}

export function getRelicChanceDetails(
  banner: RelicDrawBannerDetails,
  probabilities: RelicDrawProbabilities,
  want?: { [relicId: number]: boolean },
) {
  if (!banner.totalCount) {
    return null;
  }

  const params = getNormalBannerPullParams(banner);

  const desiredFeaturedCount =
    banner.bannerRelics && want ? _.sum(banner.bannerRelics.map((i) => (want[i] ? 1 : 0))) : null;

  const starOrBetterChancePerRelic = new Array<number>(MaxRarity).fill(0);
  let rareChancePerRelic = 0;
  _.forEach(probabilities.byRarity, (chance, rarity) => {
    for (let i = +rarity; i > 0; i--) {
      starOrBetterChancePerRelic[i] = starOrBetterChancePerRelic[i] || 0;
      starOrBetterChancePerRelic[i] += chance;
    }
    if (+rarity >= params.guaranteedRarity) {
      rareChancePerRelic += chance;
    }
  });

  let desiredCount = 0;
  let desiredChancePerRelic = 0;
  let desiredNonRareChancePerRelic = 0;
  if (want) {
    _.forEach(probabilities.byRelic, (chance, id) => {
      if (want[+id]) {
        desiredCount++;
        if (enlir.relics[+id].rarity >= params.guaranteedRarity) {
          desiredChancePerRelic += chance;
        } else {
          desiredNonRareChancePerRelic += chance;
        }
      }
    });
  }

  const relicIds =
    banner.bannerRelics && banner.bannerRelics.length
      ? banner.bannerRelics
      : _.keys(probabilities.byRelic).map((i) => +i);

  const sixStarCount = relicIds.map((i) => enlir.relics[i]).filter((i) => !!i && i.rarity >= 6)
    .length;

  const totalDetails = chanceOfDesiredDrawProp5(
    params,
    rareChancePerRelic / 100,
    rareChancePerRelic / 100,
  );
  const desiredDetails = chanceOfDesiredDrawProp5(
    params,
    rareChancePerRelic / 100,
    desiredChancePerRelic / 100,
    desiredNonRareChancePerRelic / 100,
  );

  return {
    drawCount: params.drawCount,
    starOrBetterChancePerRelic,
    desiredCount,
    desiredFeaturedCount,
    sixStarCount,
    expectedValue: totalDetails.expectedValue,
    desiredChance: desiredDetails.desiredChance,
  };
}

const chanceAfterNDraws = (chance: number, n: number) => (1 - (1 - chance) ** n) * 100;

export class RelicChances extends React.PureComponent<Props> {
  handleClear = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const { probabilities, onClear } = this.props;
    if (onClear) {
      onClear(_.keys(probabilities.byRelic).map((i) => +i));
    }
  };

  renderIcon = (icon: IconProp) => {
    const { banner } = this.props;
    return (
      <RelicDrawModalLink className={styles.simulatorLink} bannerId={banner.id}>
        <MinableCardIcon icon={icon} />
      </RelicDrawModalLink>
    );
  };

  renderWant(
    banner: RelicDrawBannerDetails,
    featuredCount: number | null,
    count: number,
    chance: number,
  ) {
    if (!count) {
      return (
        <p className="card-text">
          Select one or more relics you want from this banner to see the chances of pulling what you
          want.
        </p>
      );
    }

    const formatChance = (c: number, n: number) => chanceAfterNDraws(c, n).toFixed(2) + '%';

    let discount: number | undefined;
    let discountCost: string | undefined;
    if (banner.cost && banner.cost.mythrilCost && banner.cost.mythrilCost < StandardMythrilCost) {
      discount = StandardMythrilCost / banner.cost.mythrilCost;
      discountCost = formatChance(chance, discount);
    }
    const discountId = 'discountChance' + banner.id;

    // Two columns of 3 rows.
    let limit = 6;
    // Leave space for the normalized count for discounted banners.
    if (discount) {
      limit--;
    }
    // Show no more pulls than are possible.
    if (banner.pullLimit) {
      limit = Math.min(limit, banner.pullLimit);
    }

    return (
      <div>
        <p className="card-text">
          Odds of <RelicWantCount featuredCount={featuredCount} count={count} /> after&hellip; (
          <a href="#" onClick={this.handleClear}>
            clear
          </a>
          )
        </p>
        <div className={styles.want}>
          {_.times(limit, (i) => (
            <div key={i} className={styles.wantItem}>
              <span className={styles.wantCount}>{i + 1 + ' ' + pluralize(i + 1, 'pull')}</span>
              {formatChance(chance, i + 1)}
            </div>
          ))}
          {discount && (
            <>
              <div className={styles.wantItem}>
                <Mythril className={styles.wantCount} data-tip data-for={discountId}>
                  50
                </Mythril>
                {discountCost}
              </div>
              <ReactTooltip id={discountId} className={styles.discountTooltip}>
                <p>
                  The chances of getting a selected relic if it were possible to pull multiple times
                  on this banner, spending exactly 50 mythril total.
                </p>
                <p>
                  This helps evaluate discounted banners: the answers to &ldquo;Should I pull on
                  this discounted banner?&rdquo; and &ldquo;Would I pull on a full-priced banner
                  that gave a {discountCost} chance of getting what I want?&rdquo; are, in theory,
                  the same.
                </p>
              </ReactTooltip>
            </>
          )}
        </div>
      </div>
    );
  }

  render() {
    const { banner, probabilities, want, isAnonymous, className } = this.props;
    if (!banner.totalCount) {
      return null;
    }

    const details = getRelicChanceDetails(banner, probabilities, want);
    if (!details) {
      return null;
    }

    return (
      <MinableCard
        icon={'dice-d20'}
        className={styles.component + ' ' + className}
        iconClassName="bg-success text-white"
        bodyClassName="row"
        renderIcon={this.renderIcon}
      >
        <div className="col-sm-6">
          <p className="card-text">
            {details.starOrBetterChancePerRelic[5].toFixed(2)}% chance of 5★ or better
          </p>
          <p className="card-text">
            (ave. {details.expectedValue.toFixed(2)} 5★ or better per {details.drawCount}× pull)
          </p>
          <p className="card-text">
            {details.starOrBetterChancePerRelic[6].toFixed(2)}% chance of 6★
            {details.starOrBetterChancePerRelic[7] ? ' or better' : ''}
          </p>
          {!isAnonymous && banner.dupeCount != null && (
            <p className="card-text">
              <span className={styles.dupe}>
                {banner.dupeCount} / {banner.totalCount} dupes
              </span>
            </p>
          )}
        </div>
        <div className="col-sm-6">
          {this.renderWant(
            banner,
            details.desiredFeaturedCount,
            details.desiredCount,
            details.desiredChance,
          )}
        </div>
      </MinableCard>
    );
  }
}

export default connect((state: IState) => ({ want: state.relicDraws.want }), {
  onClear: clearWantedRelics,
})(RelicChances);

import * as React from 'react';
import { connect } from 'react-redux';

import * as _ from 'lodash';
import * as ReactTooltip from 'react-tooltip';

import {
  clearWantedRelics,
  getBannerDrawCount,
  RelicDrawProbabilities,
} from '../../actions/relicDraws';
import { enlir } from '../../data/enlir';
import { chanceOfDesiredDrawProp5, StandardMythrilCost } from '../../data/probabilities';
import { IState } from '../../reducers';
import { RelicDrawBannerDetails } from '../../selectors/relicDraws';
import { pluralize } from '../../utils/textUtils';
import { MinableCard } from '../common/MinableCard';
import { Mythril } from '../shared/Mythril';

const styles = require('./RelicChances.scss');

interface Props {
  banner: RelicDrawBannerDetails;
  probabilities: RelicDrawProbabilities;
  isAnonymous?: boolean;
  className?: string;

  want?: { [relicId: number]: boolean };
  onClear?: (relicIds: number[]) => void;
}

function getRelicChanceDetails(
  banner: RelicDrawBannerDetails,
  probabilities: RelicDrawProbabilities,
  want?: { [relicId: number]: boolean },
) {
  if (!banner.totalCount) {
    return null;
  }

  const rareChancePerRelic = (probabilities.byRarity[5] || 0) + (probabilities.byRarity[6] || 0);
  let desiredCountAndChance: [number, number];
  if (want) {
    desiredCountAndChance = _.map(probabilities.byRelic, (chance: number, id: string): [
      number,
      number,
    ] => (want[+id] ? [1, chance] : [0, 0])).reduce(([a, b], [c, d]) => [a + c, b + d], [0, 0]);
  } else {
    desiredCountAndChance = [0, 0];
  }

  const relicIds =
    banner.bannerRelics && banner.bannerRelics.length
      ? banner.bannerRelics
      : _.keys(probabilities.byRelic).map(i => +i);

  const sixStarCount = relicIds.map(i => enlir.relics[i]).filter(i => !!i && i.rarity >= 6).length;

  const drawCount = getBannerDrawCount(banner);

  const totalDetails = chanceOfDesiredDrawProp5(
    drawCount,
    rareChancePerRelic / 100,
    rareChancePerRelic / 100,
  );
  const desiredDetails = chanceOfDesiredDrawProp5(
    drawCount,
    rareChancePerRelic / 100,
    desiredCountAndChance[1] / 100,
  );

  return {
    rareChancePerRelic,
    desiredCount: desiredCountAndChance[0],
    desiredChancePerRelic: desiredCountAndChance[1],
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
      onClear(_.keys(probabilities.byRelic).map(i => +i));
    }
  };

  renderWant(banner: RelicDrawBannerDetails, count: number, chance: number) {
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
          Odds of {count === 1 ? '1 selected relic ' : `≥1 of ${count} selected relics `}
          after&hellip; (
          <a href="#" onClick={this.handleClear}>
            clear
          </a>
          )
        </p>
        <div className={styles.want}>
          {_.times(limit, i => (
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
        icon={['fal', 'dice-d20']}
        className={styles.component + ' ' + className}
        iconClassName="bg-success text-white"
        bodyClassName="row"
      >
        <div className="col-sm-6">
          <p className="card-text">
            {details.rareChancePerRelic.toFixed(2)}% chance of 5★ or better
          </p>
          <p className="card-text">
            (ave. {details.expectedValue.toFixed(2)} 5★ or better per 11× pull)
          </p>
          <p className="card-text">
            {details.sixStarCount} / {banner.totalCount} 6★ relics
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
          {this.renderWant(banner, details.desiredCount, details.desiredChance)}
        </div>
      </MinableCard>
    );
  }
}

export default connect(
  (state: IState) => ({ want: state.relicDraws.want }),
  { onClear: clearWantedRelics },
)(RelicChances);

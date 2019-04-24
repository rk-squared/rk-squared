import * as React from 'react';
import { connect } from 'react-redux';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import * as _ from 'lodash';

import { clearWantedRelics, RelicDrawProbabilities } from '../../actions/relicDraws';
import { enlir } from '../../data/enlir';
import { chanceOfDesiredDrawProp5 } from '../../data/probabilities';
import { IState } from '../../reducers';
import { RelicDrawBannerDetails } from '../../selectors/relicDraws';
import { pluralize } from '../../utils/textUtils';

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

  const rareChancePerRelic = probabilities.byRarity[5] + probabilities.byRarity[6];
  let desiredCountAndChance: [number, number];
  if (want) {
    desiredCountAndChance = _.map(
      probabilities.byRelic,
      (chance: number, id: string): [number, number] => (want[+id] ? [1, chance] : [0, 0]),
    ).reduce(([a, b], [c, d]) => [a + c, b + d], [0, 0]);
  } else {
    desiredCountAndChance = [0, 0];
  }

  const sixStarCount = _.keys(probabilities.byRelic)
    .map(i => enlir.relics[i])
    .filter(i => !!i && i.rarity >= 6).length;

  // FIXME: Get this from banner details
  const drawCount = 11;

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

  renderWant(count: number, chance: number) {
    if (!count) {
      return (
        <p className="card-text">
          Select one or more relics you want from this banner to see the chances of pulling what you
          want.
        </p>
      );
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
          {_.times(6, i => (
            <div key={i} className={styles.wantItem}>
              <span className={styles.wantCount}>{i + 1 + ' ' + pluralize(i + 1, 'pull')}</span>
              {chanceAfterNDraws(chance, i + 1).toFixed(2)}%
            </div>
          ))}
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
      <div className={classNames('card card-horizontal', styles.component, className)}>
        <div className="card-img-top bg-success text-white">
          <FontAwesomeIcon icon={['fal', 'dice-d20']} size="2x" />
        </div>
        <div className="card-body row">
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
            {this.renderWant(details.desiredCount, details.desiredChance)}
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  (state: IState) => ({ want: state.relicDraws.want }),
  { onClear: clearWantedRelics },
)(RelicChances);

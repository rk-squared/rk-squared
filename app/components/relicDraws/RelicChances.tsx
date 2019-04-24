import * as React from 'react';
import { connect } from 'react-redux';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import * as _ from 'lodash';

import { RelicDrawProbabilities } from '../../actions/relicDraws';
import { enlir } from '../../data/enlir';
import { chanceOfDesiredDrawProp5 } from '../../data/probabilities';
import { IState } from '../../reducers';
import { RelicDrawBannerDetails } from '../../selectors/relicDraws';

const styles = require('./RelicChances.scss');

interface Props {
  banner: RelicDrawBannerDetails;
  probabilities: RelicDrawProbabilities;
  isAnonymous?: boolean;
  className?: string;

  want?: { [relicId: number]: boolean };
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
  const desiredChancePerRelic = want
    ? _.sum(_.map(probabilities.byRelic, (chance: number, id: number) => (want[id] ? chance : 0)))
    : 0;

  const sixStarCount = _.keys(probabilities.byRelic)
    .map(i => enlir.relics[i])
    .filter(i => !!i && i.rarity >= 6).length;

  const totalDetails = chanceOfDesiredDrawProp5(
    banner.totalCount,
    rareChancePerRelic / 100,
    rareChancePerRelic / 100,
  );
  const desiredDetails = chanceOfDesiredDrawProp5(
    banner.totalCount,
    rareChancePerRelic / 100,
    desiredChancePerRelic / 100,
  );

  return {
    rareChancePerRelic,
    desiredChancePerRelic,
    sixStarCount,
    expectedValue: totalDetails.expectedValue,
    desiredChance: desiredDetails.desiredChance,
  };
}

export class RelicChances extends React.PureComponent<Props> {
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
        <div className="card-body">
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
      </div>
    );
  }
}

export default connect((state: IState) => ({ want: state.relicDraws.want }))(RelicChances);

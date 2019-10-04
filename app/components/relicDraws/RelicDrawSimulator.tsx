import * as React from 'react';

import * as classNames from 'classnames';
import { connect } from 'react-redux';

import { IState } from '../../reducers';

import { getBannerDrawCount, RelicDrawBanner } from '../../actions/relicDraws';
import { LangType } from '../../api/apiUrls';
import { LangContext } from '../../contexts/LangContext';
import { enlir } from '../../data/enlir';
import {
  RelicProbability,
  simulateDrawProp5,
  StandardDrawCount,
  StandardGuaranteedRarity,
} from '../../data/probabilities';
import { getRelicProbabilities } from '../../selectors/relicDraws';
import { pluralize } from '../../utils/textUtils';
import { DrawButton } from './DrawButton';
import { SimulatedRelic } from './SimulatedRelic';

const styles = require('./RelicDrawSimulator.scss');

interface StateProps {
  banner: RelicDrawBanner;
  probabilities: RelicProbability[];
}

interface OwnProps {
  bannerId: number;
  className?: string;
}

interface State {
  pullCount: number;
  relicIds: number[];
}

export class RelicDrawSimulator extends React.PureComponent<StateProps & OwnProps, State> {
  // noinspection JSUnusedGlobalSymbols
  static contextType = LangContext;
  context!: React.ContextType<typeof LangContext>;

  constructor(props: StateProps & OwnProps) {
    super(props);
    this.state = {
      pullCount: 0,
      relicIds: [],
    };
  }

  getDrawCountList() {
    const drawCount = getBannerDrawCount(this.props.banner);
    return drawCount === StandardDrawCount ? [1, 3, 11] : [drawCount];
  }

  handleDraw = (drawCount: number) => {
    const relicIds = simulateDrawProp5(
      this.props.probabilities,
      drawCount,
      StandardGuaranteedRarity,
      1,
    );
    this.setState({
      pullCount: this.state.pullCount + 1,
      relicIds,
    });
  };

  render() {
    const { className } = this.props;
    const { pullCount, relicIds } = this.state;
    const lang = this.context as LangType;
    return (
      <div className={classNames(styles.component, className)}>
        <p>
          You have pulled <strong>{pullCount}</strong> {pluralize(pullCount, 'time')}.
        </p>
        {this.getDrawCountList().map((n, i) => (
          <DrawButton drawCount={n} onClick={this.handleDraw} key={i} />
        ))}
        {pullCount > 0 && relicIds.length === 0 && <p>No rare relics drawn.</p>}
        <ul key={pullCount}>
          {relicIds.map((id, i) => (
            <li key={i}>
              <SimulatedRelic relic={enlir.relics[id]} lang={lang} />
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

export default connect<StateProps, {}, OwnProps>((state: IState, props: OwnProps) => ({
  banner: state.relicDraws.banners[props.bannerId],
  probabilities: getRelicProbabilities(state, props),
}))(RelicDrawSimulator);

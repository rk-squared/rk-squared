import * as React from 'react';

import { connect } from 'react-redux';

import { IState } from '../../reducers';

import { getBannerDrawCount, RelicDrawBanner } from '../../actions/relicDraws';
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
    return (
      <div className={className}>
        <p>
          You have pulled <strong>{pullCount}</strong> {pluralize(pullCount, 'time')}.
        </p>
        {this.getDrawCountList().map((n, i) => (
          <DrawButton drawCount={n} onClick={this.handleDraw} key={i} />
        ))}
        <ul>
          {relicIds.map((id, i) => (
            <li key={i}>{enlir.relics[id].name}</li>
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

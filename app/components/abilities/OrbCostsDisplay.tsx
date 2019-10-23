import * as React from 'react';

import * as classNames from 'classnames';

import { OrbCost, orbCosts } from '../../data/orbDetails';

const styles = require('./OrbCostsDisplay.scss');

interface Props {
  costs: OrbCost[];
  baseRarity: number;
}

export class OrbCostsDisplay extends React.Component<Props> {
  getDisplayCost(cost: OrbCost) {
    if (!orbCosts[cost.cost]) {
      return cost.cost;
    } else {
      // Most abilities have a cost for rank 1.  Record Board abilities have
      // costs starting at rank 2.
      return orbCosts[cost.cost][0] || orbCosts[cost.cost][1];
    }
  }

  render() {
    const { costs } = this.props;
    return (
      <>
        {costs.map((cost, i) => (
          <React.Fragment key={i}>
            <span className={classNames(styles.component, cost.orbType.toLowerCase())}>
              {this.getDisplayCost(cost)}
            </span>
            {i + 1 < costs.length ? ', ' : ''}
          </React.Fragment>
        ))}
      </>
    );
  }
}

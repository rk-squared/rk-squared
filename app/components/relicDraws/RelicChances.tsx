import * as React from 'react';
import { connect } from 'react-redux';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';

const styles = require('./RelicChances.scss');

interface Props {
  isAnonymous?: boolean;
  className?: string;
}

export class RelicChances extends React.Component<Props> {
  render() {
    const { isAnonymous, className } = this.props;
    return (
      <div className={classNames('card card-horizontal', styles.component, className)}>
        <div className="card-img-top bg-success text-white">
          <FontAwesomeIcon icon={['fal', 'dice-d20']} size="2x" />
        </div>
        <div className="card-body">
          <p className="card-text">14.04% chance of 5★ or better</p>
          <p className="card-text">6 / 14 6★ relics</p>
          {!isAnonymous && (
            <p className="card-text">
              <span className={styles.dupe}>3 / 14 dupes</span>
            </p>
          )}
        </div>
      </div>
    );
  }
}

export default connect()(RelicChances);

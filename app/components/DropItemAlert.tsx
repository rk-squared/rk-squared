import * as React from 'react';
import { connect } from 'react-redux';

import { DropItem } from '../actions/battle';

const styles = require('./DropItemAlert.scss');

interface Props {
  dropItems: DropItem[];
}

export class DropItemAlert extends React.Component<Props> {
  render() {
    const { dropItems } = this.props;
    if (!dropItems) {
      return null;
    }
    return (
      <div className={`alert alert-primary ${styles.container}`} role="alert">
        <h4>Drops for current battle</h4>
        {dropItems.length === 0
          ? <p>None</p>
          : <ul>
              {dropItems.map(({ name, imageUrl }, i) =>
                <li key={i}><img src={imageUrl} width={64} height={64}/> {name}</li>
              )}
            </ul>
        }
      </div>
    );
  }
}

// FIXME: Proper types
export default connect(
  (state: any) => ({
      dropItems: state.battle.dropItems
    })
)(DropItemAlert);
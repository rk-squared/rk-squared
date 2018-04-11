import * as React from 'react';

import DropItemAlert from './DropItemAlert';

const styles = require('./Home.scss');

export default class Home extends React.Component {
  render() {
    return (
      <div>
        <div className={styles.container} data-tid="container">
          <DropItemAlert/>
        </div>
      </div>
    );
  }
}

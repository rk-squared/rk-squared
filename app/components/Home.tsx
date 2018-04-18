import * as React from 'react';

import DropItemAlert from './DropItemAlert';
import OptionsComponent from './OptionsComponent';

const styles = require('./Home.scss');

export default class Home extends React.Component {
  render() {
    return (
      <div className="container">
        <div className={styles.container} data-tid="container">
          <DropItemAlert/>
          <OptionsComponent/>
        </div>
      </div>
    );
  }
}

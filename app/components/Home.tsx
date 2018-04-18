import * as React from 'react';

import DropItemAlert from './DropItemAlert';
import OptionsForm from './OptionsForm';

const styles = require('./Home.scss');

export default class Home extends React.Component {
  render() {
    return (
      <div className="container">
        <div className={styles.component} data-tid="container">
          <DropItemAlert/>
          <OptionsForm/>
        </div>
      </div>
    );
  }
}

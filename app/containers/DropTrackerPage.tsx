import * as React from 'react';

import DropItemAlert from '../components/DropItemAlert';
import Page from './Page';

export default class DropTrackerPage extends React.Component {
  render() {
    return (
      <Page title="Drops">
        <p>
          Whenever you're in a battle, the current item drops (if any) that you'll get if
          you win are displayed here.
        </p>
        <p>
          Item drops are determined when the battle starts and are saved on FFRK's servers.
          For battles that only deduct stamina if you win, you can take advantage of this to
          flee the battle and restart it until you get the item drop you want.
        </p>
        <DropItemAlert/>
      </Page>
    );
  }
};

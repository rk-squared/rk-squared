import * as React from 'react';
import Page from './Page';
import DropItemAlert from '../components/DropItemAlert';

export default class DropTrackerPage extends React.Component {
  render() {
    return (
      <Page title="Drops">
        <p>
          Whenever you're in a battle, the current item drops (if any) will display here.
        </p>
        <p>
          Item drops are determined when the battle starts and are saved on FFRK's servers.
          For battles that only cost stamina upon victory, you can take advantage of this to
          flee the battle and restart it until you get the item drop you want.
        </p>
        <DropItemAlert/>
      </Page>
    );
  }
};

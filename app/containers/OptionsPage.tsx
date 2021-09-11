import * as React from 'react';
import { RouteComponentProps } from 'react-router';

import OptionsForm from '../components/options/OptionsForm';
import { Page } from './Page';

export default class OptionsPage extends React.Component<RouteComponentProps<any>> {
  render() {
    return (
      <Page title="Options">
        <p>
          Modify FFRK to improve your gaming experience. Unless otherwise noted, all options take
          effect as soon as you enter the appropriate screen.
        </p>
        <OptionsForm />
      </Page>
    );
  }
}

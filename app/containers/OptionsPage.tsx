import * as React from 'react';
import { RouteComponentProps } from 'react-router';

import { DonationInfo } from '../components/DonationInfo';
import OptionsForm from '../components/OptionsForm';
import { Page } from './Page';

export default class OptionsPage extends React.Component<RouteComponentProps<any>> {
  renderFooter = () => <DonationInfo />;

  render() {
    return (
      <Page title="Options" footer={this.renderFooter}>
        <p>
          Modify FFRK to improve your gaming experience. Unless otherwise noted, all options take
          effect as soon as you enter the appropriate screen.
        </p>
        <OptionsForm />
      </Page>
    );
  }
}

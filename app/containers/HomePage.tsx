import * as React from 'react';

import { DonationInfo } from '../components/DonationInfo';
import { Home } from '../components/Home';
import { Page } from './Page';

export class HomePage extends React.Component {
  renderFooter = () => <DonationInfo />;

  render() {
    return (
      <Page title="Welcome" footer={this.renderFooter}>
        <Home />
      </Page>
    );
  }
}

export default HomePage;

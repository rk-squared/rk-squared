import * as React from 'react';

import { DonationInfo } from '../components/DonationInfo';
import { SiteHome } from '../components/home/SiteHome';
import { Page } from './Page';

export class SiteHomePage extends React.Component {
  renderFooter = () => <DonationInfo />;

  render() {
    return (
      <Page title="RK Squared" footer={this.renderFooter}>
        <SiteHome />
      </Page>
    );
  }
}

export default SiteHomePage;

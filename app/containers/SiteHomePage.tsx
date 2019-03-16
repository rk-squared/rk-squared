import * as React from 'react';

import { DonationInfo } from '../components/DonationInfo';
import { SiteHome } from '../components/SiteHome';
import { Page } from './Page';

export class SiteHomePage extends React.Component {
  renderFooter = () => <DonationInfo />;

  render() {
    return (
      <Page title="Welcome" footer={this.renderFooter}>
        <SiteHome />
      </Page>
    );
  }
}

export default SiteHomePage;

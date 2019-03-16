import * as React from 'react';

import { DesktopHome } from '../components/DesktopHome';
import { DonationInfo } from '../components/DonationInfo';
import { Page } from './Page';

export class DesktopHomePage extends React.Component {
  renderFooter = () => <DonationInfo />;

  render() {
    return (
      <Page title="Welcome" footer={this.renderFooter}>
        <DesktopHome />
      </Page>
    );
  }
}

export default DesktopHomePage;

import * as React from 'react';

import { DonationInfo } from '../components/DonationInfo';
import { DesktopHome } from '../components/home/DesktopHome';
import { Page } from './Page';

export class DesktopHomePage extends React.Component {
  renderFooter = () => <DonationInfo />;

  render() {
    return (
      <Page title={Page.AppTitle} footer={this.renderFooter}>
        <DesktopHome />
      </Page>
    );
  }
}

export default DesktopHomePage;

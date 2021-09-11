import * as React from 'react';

import { SiteHome } from '../components/home/SiteHome';
import { Page } from './Page';

export class SiteHomePage extends React.Component {
  render() {
    return (
      <Page title={Page.AppTitle}>
        <SiteHome />
      </Page>
    );
  }
}

export default SiteHomePage;

import * as React from 'react';

import { DesktopHome } from '../components/home/DesktopHome';
import { Page } from './Page';

export class DesktopHomePage extends React.Component {
  render() {
    return (
      <Page title={Page.AppTitle}>
        <DesktopHome />
      </Page>
    );
  }
}

export default DesktopHomePage;

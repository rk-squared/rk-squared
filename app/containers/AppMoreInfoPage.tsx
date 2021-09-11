import * as React from 'react';

import { AppMoreInfo } from '../components/home/AppMoreInfo';
import { Page } from './Page';

export class AppMoreInfoPage extends React.Component {
  render() {
    return (
      <Page title="The RK² Application">
        <AppMoreInfo />
      </Page>
    );
  }
}

export default AppMoreInfo;

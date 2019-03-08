import * as React from 'react';

import { SoulBreakList } from '../components/soulBreaks/SoulBreakList';
import { Page } from './Page';

export class SoulBreaksPage extends React.Component {
  render() {
    return (
      <Page title="Soul Breaks">
        <SoulBreakList />
      </Page>
    );
  }
}

export default SoulBreaksPage;

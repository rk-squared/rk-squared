import * as React from 'react';

import SharedSoulBreakList from '../components/soulBreaks/SharedSoulBreakList';
import { Page } from './Page';

export class SharedSoulBreaksPage extends React.Component {
  render() {
    const isAnonymous = !process.env.IS_ELECTRON;
    return (
      <Page title="Shared Soul Breaks">
        <SharedSoulBreakList isAnonymous={isAnonymous} />
      </Page>
    );
  }
}

export default SharedSoulBreaksPage;

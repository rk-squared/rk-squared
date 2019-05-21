import * as React from 'react';

import SoulBreakList from '../components/soulBreaks/SoulBreakList';
import { SoulBreaksNav } from '../components/soulBreaks/SoulBreaksNav';
import UnmasteredSoulBreakAlert from '../components/soulBreaks/UnmasteredSoulBreakAlert';
import { Page } from './Page';

const soulBreakAnchor = (letter: string) => `soulBreaks-${letter}`;

export class SoulBreaksPage extends React.Component {
  render() {
    const isAnonymous = !process.env.IS_ELECTRON;
    return (
      <Page title="Soul Breaks">
        <SoulBreaksNav soulBreakAnchor={soulBreakAnchor} isAnonymous={isAnonymous} />

        {!isAnonymous && <UnmasteredSoulBreakAlert className="mt-2" />}
        <SoulBreakList letterAnchor={soulBreakAnchor} isAnonymous={isAnonymous} />
      </Page>
    );
  }
}

export default SoulBreaksPage;

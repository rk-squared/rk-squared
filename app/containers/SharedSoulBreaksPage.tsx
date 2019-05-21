import * as React from 'react';

import SharedSoulBreakList from '../components/soulBreaks/SharedSoulBreakList';
import SoulBreaksNavPrefsMenu from '../components/soulBreaks/SoulBreaksNavPrefsMenu';
import { Page } from './Page';

export class SharedSoulBreaksPage extends React.Component {
  render() {
    const isAnonymous = !process.env.IS_ELECTRON;
    return (
      <Page title="Shared Soul Breaks">
        <SharedSoulBreakList isAnonymous={isAnonymous} />

        <nav className="navbar navbar-expand sticky-top navbar-light">
          <div className="collapse navbar-collapse" role="navigation">
            <ul className="navbar-nav w-100">
              <SoulBreaksNavPrefsMenu isAnonymous={isAnonymous} className="dropup" />
            </ul>
          </div>
        </nav>
      </Page>
    );
  }
}

export default SharedSoulBreaksPage;

import * as React from 'react';

import { HashLink } from 'react-router-hash-link';

import SoulBreakList from '../components/soulBreaks/SoulBreakList';
import UnmasteredSoulBreakAlert from '../components/soulBreaks/UnmasteredSoulBreakAlert';
import { alphabet } from '../utils/textUtils';
import { Page } from './Page';

const soulBreakAnchor = (letter: string) => `soulBreaks-${letter}`;

export class SoulBreaksPage extends React.Component {
  render() {
    const isAnonymous = !process.env.IS_ELECTRON;
    return (
      <Page title="Soul Breaks">
        <nav className="navbar navbar-expand-lg sticky-top navbar-light bg-light">
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav">
              {alphabet.map((letter, i) => (
                <li className="nav-item" key={i}>
                  <HashLink className="nav-link" to={'#' + soulBreakAnchor(letter)}>
                    {letter}
                  </HashLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {!isAnonymous && <UnmasteredSoulBreakAlert className="mt-2" />}
        <SoulBreakList letterAnchor={soulBreakAnchor} isAnonymous={isAnonymous} />
      </Page>
    );
  }
}

export default SoulBreaksPage;

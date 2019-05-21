import * as React from 'react';
import { HashLink } from 'react-router-hash-link';

import { alphabet } from '../../utils/textUtils';
import { partitionArray } from '../../utils/typeUtils';
import SoulBreaksNavPrefsMenu from './SoulBreaksNavPrefsMenu';

interface Props {
  isAnonymous?: boolean;
  soulBreakAnchor: (letter: string) => string;
}

const alphabetParts = partitionArray(alphabet, 4);

export class SoulBreaksNav extends React.PureComponent<Props> {
  render() {
    const { isAnonymous, soulBreakAnchor } = this.props;
    return (
      <nav className="navbar navbar-expand sticky-top navbar-light bg-light">
        <div className="collapse navbar-collapse" role="navigation">
          {/* Switch to dropdowns at lg - which is actually a bit too small, */}
          {/* esp. if side ads are present... */}
          <ul className="navbar-nav d-none d-lg-flex w-100">
            {alphabet.map((letter, i) => (
              <li className="nav-item" key={i}>
                <HashLink className="nav-link" to={'#' + soulBreakAnchor(letter)}>
                  {letter}
                </HashLink>
              </li>
            ))}
            <SoulBreaksNavPrefsMenu isAnonymous={isAnonymous} />
          </ul>
          <ul className="navbar-nav d-lg-none w-100">
            {alphabetParts.map((letters, i) => (
              <li className="nav-item dropdown" key={i}>
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  id={`soulBreaksDropdown${i}`}
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  {letters[0]}-{letters[letters.length - 1]}
                </a>
                <div className="dropdown-menu" aria-labelledby={`soulBreaksDropdown${i}`}>
                  {letters.map((letter, j) => (
                    <HashLink className="dropdown-item" to={'#' + soulBreakAnchor(letter)} key={j}>
                      {letter}
                    </HashLink>
                  ))}
                </div>
              </li>
            ))}
            <SoulBreaksNavPrefsMenu isAnonymous={isAnonymous} />
          </ul>
        </div>
      </nav>
    );
  }
}

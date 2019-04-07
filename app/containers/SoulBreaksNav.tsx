import * as React from 'react';
import { HashLink } from 'react-router-hash-link';

import { alphabet } from '../utils/textUtils';

interface Props {
  soulBreakAnchor: (letter: string) => string;
}

export const SoulBreaksNav = ({ soulBreakAnchor }: Props) => (
  <nav className="navbar navbar-expand sticky-top navbar-light bg-light">
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
);

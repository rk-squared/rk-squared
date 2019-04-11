import * as React from 'react';
import { connect } from 'react-redux';
import { HashLink } from 'react-router-hash-link';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ShowSoulBreaksType, updatePrefs } from '../../actions/prefs';
import { IState } from '../../reducers';
import { alphabet } from '../../utils/textUtils';
import { partitionArray } from '../../utils/typeUtils';

interface Props {
  soulBreakAnchor: (letter: string) => string;
  showSoulBreaks?: ShowSoulBreaksType;
  updateShowSoulBreaks?: (showSoulBreaks: ShowSoulBreaksType) => void;
}

interface PrefsMenuProps {
  showSoulBreaks?: ShowSoulBreaksType;
  updateShowSoulBreaks: (showSoulBreaks: ShowSoulBreaksType) => void;
}

const alphabetParts = partitionArray(alphabet, 4);

const SoulBreaksNavPrefsMenu = ({ showSoulBreaks, updateShowSoulBreaks }: PrefsMenuProps) => (
  <li className="nav-item dropdown">
    <a
      className="nav-link dropdown-toggle"
      href="#"
      id="soulBreaksPrefsDropdown"
      data-toggle="dropdown"
      aria-haspopup="true"
      aria-expanded="false"
    >
      <FontAwesomeIcon icon="cog" />
    </a>
    <div className="dropdown-menu" aria-labelledby="soulBreaksPrefsDropdown">
      <a
        className="dropdown-item"
        href="#"
        onClick={e => {
          e.preventDefault();
          updateShowSoulBreaks(ShowSoulBreaksType.ALL);
        }}
      >
        JP and GL
      </a>
      <a
        className="dropdown-item"
        href="#"
        onClick={e => {
          e.preventDefault();
          updateShowSoulBreaks(ShowSoulBreaksType.GL);
        }}
      >
        GL
      </a>
      <a
        className="dropdown-item"
        href="#"
        onClick={e => {
          e.preventDefault();
          updateShowSoulBreaks(ShowSoulBreaksType.OWNED);
        }}
      >
        Owned
      </a>
    </div>
  </li>
);

export class SoulBreaksNav extends React.PureComponent<Props> {
  renderPrefsMenu() {
    const { showSoulBreaks, updateShowSoulBreaks } = this.props;
    if (!updateShowSoulBreaks) {
      return null;
    }
    return (
      <SoulBreaksNavPrefsMenu
        showSoulBreaks={showSoulBreaks}
        updateShowSoulBreaks={updateShowSoulBreaks}
      />
    );
  }

  render() {
    const { soulBreakAnchor } = this.props;
    return (
      <nav className="navbar navbar-expand sticky-top navbar-light bg-light">
        <div className="collapse navbar-collapse">
          {/* Switch to dropdowns at lg - which is actually a bit too small, */}
          {/* esp. if side ads are present... */}
          <ul className="navbar-nav d-none d-lg-flex">
            {alphabet.map((letter, i) => (
              <li className="nav-item" key={i}>
                <HashLink className="nav-link" to={'#' + soulBreakAnchor(letter)}>
                  {letter}
                </HashLink>
              </li>
            ))}
            {this.renderPrefsMenu()}
          </ul>
          <ul className="navbar-nav d-lg-none">
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
            {this.renderPrefsMenu()}
          </ul>
        </div>
      </nav>
    );
  }
}

export default connect(
  ({ prefs: { showSoulBreaks } }: IState) => ({ showSoulBreaks }),
  dispatch => ({
    updateShowSoulBreaks: (showSoulBreaks: ShowSoulBreaksType) =>
      dispatch(updatePrefs({ showSoulBreaks })),
  }),
)(SoulBreaksNav);

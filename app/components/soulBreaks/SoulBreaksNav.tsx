import * as React from 'react';
import { connect } from 'react-redux';
import { HashLink } from 'react-router-hash-link';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ShowSoulBreaksType, updatePrefs } from '../../actions/prefs';
import { IState } from '../../reducers';
import { alphabet } from '../../utils/textUtils';
import { partitionArray } from '../../utils/typeUtils';
import { NavDropdownItem } from '../common/NavDropdownItem';
import { NavMenuDropdown } from '../common/NavMenuDropdown';

interface Props {
  isAnonymous?: boolean;
  soulBreakAnchor: (letter: string) => string;
  showSoulBreaks?: ShowSoulBreaksType;
  updateShowSoulBreaks?: (showSoulBreaks: ShowSoulBreaksType) => void;
}

interface PrefsMenuProps {
  isAnonymous?: boolean;
  showSoulBreaks?: ShowSoulBreaksType;
  updateShowSoulBreaks: (showSoulBreaks: ShowSoulBreaksType) => void;
}

const alphabetParts = partitionArray(alphabet, 4);

const Bullet = ({ show }: { show: boolean }) => (
  <span className={show ? '' : 'invisible'} aria-label="selected">
    ●
  </span>
);

const SoulBreaksNavPrefsMenu = ({
  isAnonymous,
  showSoulBreaks,
  updateShowSoulBreaks,
}: PrefsMenuProps) => (
  <NavMenuDropdown
    id="soulBreakPrefsDropdown"
    label="preferences"
    className="ml-auto"
    linkClassName="caret-off"
    display={<FontAwesomeIcon icon="cog" />}
    right={true}
  >
    <NavDropdownItem onClick={() => updateShowSoulBreaks(ShowSoulBreaksType.All)}>
      <Bullet show={showSoulBreaks === ShowSoulBreaksType.All} /> JP and GL
    </NavDropdownItem>
    <NavDropdownItem onClick={() => updateShowSoulBreaks(ShowSoulBreaksType.Gl)}>
      <Bullet show={showSoulBreaks === ShowSoulBreaksType.Gl} /> GL
    </NavDropdownItem>
    {!isAnonymous && (
      <NavDropdownItem onClick={() => updateShowSoulBreaks(ShowSoulBreaksType.Owned)}>
        <Bullet show={showSoulBreaks === ShowSoulBreaksType.Owned} /> Owned
      </NavDropdownItem>
    )}
  </NavMenuDropdown>
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
            {this.renderPrefsMenu()}
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

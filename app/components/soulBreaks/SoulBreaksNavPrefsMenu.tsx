import * as React from 'react';
import { connect } from 'react-redux';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ShowSoulBreaksType, updatePrefs } from '../../actions/prefs';
import { IState } from '../../reducers';
import { NavDropdownItem } from '../common/NavDropdownItem';
import { NavMenuDropdown } from '../common/NavMenuDropdown';

interface PrefsMenuProps {
  isAnonymous?: boolean;
  showSoulBreaks?: ShowSoulBreaksType;
  updateShowSoulBreaks: (showSoulBreaks: ShowSoulBreaksType) => void;
  className?: string;
}

const Bullet = ({ show }: { show: boolean }) => (
  <span className={show ? '' : 'invisible'} aria-label="selected">
    ●
  </span>
);

export const SoulBreaksNavPrefsMenu = ({
  isAnonymous,
  showSoulBreaks,
  updateShowSoulBreaks,
  className,
}: PrefsMenuProps) => (
  <NavMenuDropdown
    id="soulBreakPrefsDropdown"
    label="preferences"
    className={className}
    linkClassName="caret-off"
    display={<FontAwesomeIcon icon="cog" aria-label="Settings" />}
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

export default connect(
  ({ prefs: { showSoulBreaks } }: IState) => ({ showSoulBreaks }),
  dispatch => ({
    updateShowSoulBreaks: (showSoulBreaks: ShowSoulBreaksType) =>
      dispatch(updatePrefs({ showSoulBreaks })),
  }),
)(SoulBreaksNavPrefsMenu);

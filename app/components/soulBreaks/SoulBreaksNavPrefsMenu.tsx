import * as React from 'react';
import { connect } from 'react-redux';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ShowSoulBreaksType, updatePrefs } from '../../actions/prefs';
import { IState } from '../../reducers';
import { DropdownItem } from '../common/Dropdown';
import { Bullet } from '../common/Glyphs';
import { NavMenuDropdown } from '../common/NavMenuDropdown';

interface PrefsMenuProps {
  isAnonymous?: boolean;
  showSoulBreaks?: ShowSoulBreaksType;
  updateShowSoulBreaks: (showSoulBreaks: ShowSoulBreaksType) => void;
  className?: string;
}

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
    <DropdownItem onClick={() => updateShowSoulBreaks(ShowSoulBreaksType.All)}>
      <Bullet show={showSoulBreaks === ShowSoulBreaksType.All} /> JP and GL
    </DropdownItem>
    <DropdownItem onClick={() => updateShowSoulBreaks(ShowSoulBreaksType.Gl)}>
      <Bullet show={showSoulBreaks === ShowSoulBreaksType.Gl} /> GL
    </DropdownItem>
    {!isAnonymous && (
      <DropdownItem onClick={() => updateShowSoulBreaks(ShowSoulBreaksType.Owned)}>
        <Bullet show={showSoulBreaks === ShowSoulBreaksType.Owned} /> Owned
      </DropdownItem>
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

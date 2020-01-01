import * as React from 'react';

import * as ReactTooltip from 'react-tooltip';

import { LangType } from '../../api/apiUrls';
import { LangContext } from '../../contexts/LangContext';
import { enlir, EnlirAbility } from '../../data/enlir';
import { getEventText, getReleaseDate } from '../../data/futureAbilities';
import * as urls from '../../data/urls';

const styles = require('./AbilityTooltip.scss');

interface Props {
  id: string;
}

export class AbilityTooltip extends React.Component<Props> {
  // noinspection JSUnusedGlobalSymbols
  static contextType = LangContext;
  context!: React.ContextType<typeof LangContext>;

  getEventDetails = (ability: EnlirAbility) => {
    if (!ability.introducingEvent) {
      return null;
    }
    const releaseDate = getReleaseDate(ability);
    if (releaseDate === ability.introducingEvent) {
      return 'Expected in ' + releaseDate;
    } else {
      return 'Expected in ' + releaseDate + ' as part of ' + getEventText(ability.introducingEvent);
    }
  };

  getContent = (abilityId: string) => {
    if (!abilityId) {
      return null;
    }
    const ability = enlir.abilities[abilityId];
    const lang = ability.gl ? (this.context as LangType) : LangType.Jp;
    const character = ability.recordBoardCharacter
      ? enlir.charactersByName[ability.recordBoardCharacter]
      : undefined;
    return (
      <>
        <div className={styles.iconsBlock}>
          {character && <img src={urls.characterImage(lang, character.id)} />}
          <img src={urls.abilityImage(lang, +abilityId)} />
        </div>

        <div className={styles.textBlock}>
          <h6>{ability.name}</h6>
          <div className={styles.detail}>Cast time: {ability.time} sec</div>
          <div className={styles.detail}>{ability.sb} SB pts.</div>
          <p>{ability.effects}</p>
          {!ability.gl && <p className={styles.eventDetail}>{this.getEventDetails(ability)}</p>}
        </div>
      </>
    );
  };

  render() {
    const { id } = this.props;
    return (
      <ReactTooltip
        id={id}
        className={styles.component}
        place="bottom"
        getContent={this.getContent}
      />
    );
  }
}

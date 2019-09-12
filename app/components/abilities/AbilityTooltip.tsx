import * as React from 'react';

import * as ReactTooltip from 'react-tooltip';

import { LangType } from '../../api/apiUrls';
import { LangContext } from '../../contexts/LangContext';
import { enlir } from '../../data/enlir';
import * as urls from '../../data/urls';

const styles = require('./AbilityTooltip.scss');

interface Props {
  id: string;
}

export class AbilityTooltip extends React.Component<Props> {
  // noinspection JSUnusedGlobalSymbols
  static contextType = LangContext;
  context!: React.ContextType<typeof LangContext>;

  getContent = (abilityId: string) => {
    if (!abilityId) {
      return null;
    }
    const ability = enlir.abilities[abilityId];
    const lang = ability.gl ? (this.context as LangType) : LangType.Jp;
    return (
      <>
        <div className={styles.iconsBlock}>
          <img src={urls.abilityImage(lang, +abilityId)} />
        </div>

        <div className={styles.textBlock}>
          <h6>{ability.name}</h6>
          <div className={styles.detail}>Cast time: {ability.time} sec</div>
          <div className={styles.detail}>{ability.sb} SB pts.</div>
          <p>{ability.effects}</p>
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

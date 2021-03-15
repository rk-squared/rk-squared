import * as React from 'react';
import * as ReactTooltip from 'react-tooltip';
import { LangType } from '../../api/apiUrls';
import { LangContext } from '../../contexts/LangContext';
import { enlir } from '../../data/enlir';
import * as urls from '../../data/urls';

const styles = require('./SoulBreakTooltip.module.scss');

interface Props {
  id: string;
}

export class SoulBreakTooltip extends React.Component<Props> {
  // noinspection JSUnusedGlobalSymbols
  static contextType = LangContext;
  context!: React.ContextType<typeof LangContext>;

  getContent = (soulBreakId: string) => {
    if (!soulBreakId) {
      return null;
    }
    const soulBreak = enlir.soulBreaks[soulBreakId];
    const lang = soulBreak.gl ? (this.context as LangType) : LangType.Jp;
    const character = soulBreak.character ? enlir.charactersByName[soulBreak.character] : undefined;
    return (
      <>
        <div className={styles.iconsBlock}>
          {character && <img src={urls.characterImage(lang, character.id)} alt={character.name} />}
          <img src={urls.soulBreakImage(lang, +soulBreakId)} alt="" />
        </div>

        <div className={styles.textBlock}>
          <h6>{soulBreak.name}</h6>
          <div className={styles.castTimeDetail}>Cast time: {soulBreak.time} sec</div>
          <p>{soulBreak.effects}</p>
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

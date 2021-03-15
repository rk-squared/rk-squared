import * as React from 'react';

import { LangType } from '../../api/apiUrls';
import { LangContext } from '../../contexts/LangContext';
import { enlir } from '../../data/enlir';
import * as urls from '../../data/urls';

const styles = require('./RecordBoardCharacterIcon.module.scss');

interface Props {
  character: string | undefined;
}

export class RecordBoardCharacterIcon extends React.PureComponent<Props> {
  // noinspection JSUnusedGlobalSymbols
  static contextType = LangContext;
  context!: React.ContextType<typeof LangContext>;

  render() {
    const { character } = this.props;
    if (!character || !enlir.charactersByName[character]) {
      return null;
    }

    const { id, gl } = enlir.charactersByName[character];
    const lang = gl ? (this.context as LangType) : LangType.Jp;

    return (
      <img src={urls.characterImage(lang, id)} className={styles.characterIcon} alt={character} />
    );
  }
}

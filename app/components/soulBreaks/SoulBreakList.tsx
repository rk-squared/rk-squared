import * as React from 'react';

import * as _ from 'lodash';

import { enlir, isCoreJob } from '../../data/enlir';
import { alphabet, alphabetize } from '../../utils/textUtils';
import { CharacterSoulBreaks } from './CharacterSoulBreaks';

const styles = require('./SoulBreakList.scss');

const characters = alphabetize(_.values(enlir.characters).filter(i => !isCoreJob(i)), i => i.name);

interface Props {
  letterAnchor?: (letter: string) => string;
}

export class SoulBreakList extends React.Component<Props> {
  render() {
    const { letterAnchor } = this.props;
    return (
      <>
        {alphabet.map(
          (letter, i) =>
            characters[letter] && (
              <div className={styles.component} key={i}>
                <h3 id={letterAnchor ? letterAnchor(letter) : undefined}>{letter}</h3>
                <div className="card-columns">
                  {characters[letter].map((character, j) => (
                    <CharacterSoulBreaks character={character.name} key={j} />
                  ))}
                </div>
              </div>
            ),
        )}
      </>
    );
  }
}

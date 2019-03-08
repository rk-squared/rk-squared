import * as React from 'react';

import * as _ from 'lodash';

import { enlir } from '../../data/enlir';
import { alphabet, alphabetize } from '../../utils/textUtils';
import { CharacterSoulBreaks } from './CharacterSoulBreaks';

const characters = alphabetize(_.values(enlir.characters), i => i.name);

export class SoulBreakList extends React.Component {
  render() {
    return (
      <>
        {alphabet.map(
          (letter, i) =>
            characters[letter] && (
              <div key={i}>
                <h3>{letter}</h3>
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

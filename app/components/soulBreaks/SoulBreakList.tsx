import * as React from 'react';
import { connect } from 'react-redux';

import * as _ from 'lodash';

import { filterSoulBreaks, ShowSoulBreaksType } from '../../actions/prefs';
import { enlir, isCoreJob } from '../../data/enlir';
import { IState } from '../../reducers';
import { getOwnedLegendMateria, getOwnedSoulBreaks } from '../../selectors/characters';
import { alphabet, alphabetize } from '../../utils/textUtils';
import { CharacterSoulBreaks } from './CharacterSoulBreaks';

const styles = require('./SoulBreakList.scss');

const characters = alphabetize(_.values(enlir.characters).filter(i => !isCoreJob(i)), i => i.name);

interface Props {
  // Optional function for generating HTML anchors for letters.
  letterAnchor?: (letter: string) => string;

  ownedSoulBreaks?: Set<number>;
  ownedLegendMateria?: Set<number>;
  showSoulBreaks?: ShowSoulBreaksType;

  isAnonymous?: boolean;
}

export class SoulBreakList extends React.Component<Props> {
  render() {
    const {
      letterAnchor,
      isAnonymous,
      ownedSoulBreaks,
      ownedLegendMateria,
      showSoulBreaks,
    } = this.props;
    const soulBreaksFilter = filterSoulBreaks(showSoulBreaks, ownedSoulBreaks);
    const legendMateriaFilter = filterSoulBreaks(showSoulBreaks, ownedLegendMateria);
    return (
      <>
        {alphabet.map(
          (letter, i) =>
            characters[letter] && (
              <div className={styles.component} key={i}>
                <h3 id={letterAnchor ? letterAnchor(letter) : undefined}>{letter}</h3>
                <div className="card-columns">
                  {characters[letter].map((character, j) => (
                    <CharacterSoulBreaks
                      character={character.name}
                      ownedSoulBreaks={isAnonymous ? undefined : ownedSoulBreaks}
                      ownedLegendMateria={isAnonymous ? undefined : ownedLegendMateria}
                      soulBreaksFilter={soulBreaksFilter}
                      legendMateriaFilter={legendMateriaFilter}
                      key={j}
                    />
                  ))}
                </div>
              </div>
            ),
        )}
      </>
    );
  }
}

export default connect((state: IState) => ({
  ownedSoulBreaks: getOwnedSoulBreaks(state),
  ownedLegendMateria: getOwnedLegendMateria(state),
  showSoulBreaks: state.prefs.showSoulBreaks,
}))(SoulBreakList);

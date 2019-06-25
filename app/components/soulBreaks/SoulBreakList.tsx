import * as React from 'react';
import { connect } from 'react-redux';

import * as _ from 'lodash';

import { filterSoulBreaks, ShowSoulBreaksType } from '../../actions/prefs';
import { enlir, EnlirSoulBreakOrLegendMateria, isCoreJob } from '../../data/enlir';
import { IState } from '../../reducers';
import { getOwnedLegendMateria, getOwnedSoulBreaks } from '../../selectors/characters';
import { alphabet, alphabetize } from '../../utils/textUtils';
import { SearchResults, searchSoulBreaksAndLegendMateria } from '../shared/SoulBreakShared';
import { CharacterSoulBreaks } from './CharacterSoulBreaks';

const styles = require('./SoulBreakList.scss');

const characters = alphabetize(_.values(enlir.characters).filter(i => !isCoreJob(i)), i => i.name);

function combineFilter<T extends { id: number }>(filter: (item: T) => boolean, set: Set<number>) {
  return (item: T) => filter(item) && set.has(item.id);
}

interface Props {
  // Optional function for generating HTML anchors for letters.
  letterAnchor?: (letter: string) => string;

  ownedSoulBreaks?: Set<number>;
  ownedLegendMateria?: Set<number>;
  showSoulBreaks?: ShowSoulBreaksType;

  isAnonymous?: boolean;
  searchFilter?: string;
}

export class SoulBreakList extends React.Component<Props> {
  render() {
    const {
      letterAnchor,
      isAnonymous,
      ownedSoulBreaks,
      ownedLegendMateria,
      showSoulBreaks,
      searchFilter,
    } = this.props;

    const soulBreaksShowFilter = filterSoulBreaks(showSoulBreaks, ownedSoulBreaks);
    const legendMateriaShowFilter = filterSoulBreaks(showSoulBreaks, ownedLegendMateria);

    let searchResults: SearchResults | undefined;
    let showCharacters: typeof characters;
    let soulBreaksFilter: (item: EnlirSoulBreakOrLegendMateria) => boolean;
    let legendMateriaFilter: (item: EnlirSoulBreakOrLegendMateria) => boolean;
    if (searchFilter) {
      searchResults = searchSoulBreaksAndLegendMateria(searchFilter);
      showCharacters = _.mapValues(characters, c =>
        c.filter(i => searchResults!.characters.has(i.name)),
      );
      soulBreaksFilter = combineFilter(soulBreaksShowFilter, searchResults.soulBreakIds);
      legendMateriaFilter = combineFilter(legendMateriaShowFilter, searchResults.legendMateriaIds);
    } else {
      showCharacters = characters;
      soulBreaksFilter = soulBreaksShowFilter;
      legendMateriaFilter = legendMateriaShowFilter;
    }

    return (
      <>
        {alphabet.map(
          (letter, i) =>
            showCharacters[letter] &&
            showCharacters[letter].length > 0 && (
              <div className={styles.component} key={i}>
                <h3 id={letterAnchor ? letterAnchor(letter) : undefined}>{letter}</h3>
                <div className="card-columns">
                  {showCharacters[letter].map((character, j) => (
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

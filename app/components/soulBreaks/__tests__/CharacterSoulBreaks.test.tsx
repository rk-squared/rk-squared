import * as React from 'react';
import * as renderer from 'react-test-renderer';

import { CharacterSoulBreaks } from '../CharacterSoulBreaks';

describe('CharacterSoulBreaks', () => {
  it('renders multiple kinds of soul breaks and shows ownership', () => {
    const soulBreaks = new Set<number>([20080013]);
    const legendMateria = new Set<number>([201040300, 201040301, 201040303]);
    const tree = renderer
      .create(
        <CharacterSoulBreaks
          character="Kain"
          ownedSoulBreaks={soulBreaks}
          ownedLegendMateria={legendMateria}
        />,
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders multiple kinds of soul breaks in anonymous mode', () => {
    const tree = renderer.create(<CharacterSoulBreaks character="Kain" />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});

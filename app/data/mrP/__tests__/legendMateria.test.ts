import { describeMrPLegendMateria } from '../legendMateria';

import * as _ from 'lodash';

import { enlir } from '../../enlir';

describe('mrP/legendMateria', () => {
  describe('describeMrPLegendMateria', () => {
    it('converts all legend materia', () => {
      const allLegendMateria = _.sortBy(_.values(enlir.legendMateria), ['character', 'id']).map(
        i => ({
          name: i.name,
          character: i.character,
          effect: i.effect,
          description: describeMrPLegendMateria(i),
        }),
      );

      // Verify that we can at least attempt to convert each legend materia.
      for (const i of allLegendMateria) {
        if (i.description == null) {
          throw new Error(`Failed to process ${i.character}: ${i.name}: ${i.effect}`);
        }
      }

      // Verify the legend materia as a whole to catch additional errors and regressions.
      expect(allLegendMateria).toMatchSnapshot();
    });
  });
});

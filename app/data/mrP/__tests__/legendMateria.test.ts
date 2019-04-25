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
      expect(allLegendMateria).toMatchSnapshot();
    });
  });
});

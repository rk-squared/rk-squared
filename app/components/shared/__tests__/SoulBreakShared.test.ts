import * as _ from 'lodash';

import { searchSoulBreaksAndLegendMateria } from '../SoulBreakShared';

import { enlir } from '../../../data/enlir';

function doSimpleSearch(searchFilter: string): string[] {
  const results = searchSoulBreaksAndLegendMateria(searchFilter);
  const characters = Array.from(results.characters.values()).sort();
  return _.flatten(
    characters.map((c) =>
      _.flatten([
        enlir.soulBreaksByCharacter[c]
          .filter((i) => results.soulBreakIds.has(i.id))
          .map((i) => i.character + ' - ' + i.name),
        enlir.legendMateriaByCharacter[c]
          .filter((i) => results.legendMateriaIds.has(i.id))
          .map((i) => i.character + ' - ' + i.name),
      ]),
    ),
  );
}

describe('SoulBreakShared', () => {
  describe('searchSoulBreaksAndLegendMateria', () => {
    it('searches for a character', () => {
      expect(doSimpleSearch('noctis')).toMatchInlineSnapshot(`
        Array [
          "Noctis - Warp-strike",
          "Noctis - Gladiolus Link",
          "Noctis - Kings of Old",
          "Noctis - Royal Guardian",
          "Noctis - Warp Factor",
          "Noctis - Static Edge",
          "Noctis - Link Up",
          "Noctis - Armiger",
          "Noctis - Armiger Wakes",
          "Noctis - Airstride",
          "Noctis - Critical Link",
          "Noctis - Rush Link",
          "Noctis - Regal Flair",
          "Noctis - True Ignis Link",
          "Noctis - True Gladiolus Link",
          "Noctis - True Prompto Link",
          "Noctis - Steel Pirouette F (Engaged)",
          "Noctis - Steel Pirouette F",
          "Noctis - Bond (Noctis)",
          "Noctis - Awoken Warp-strike",
          "Noctis - Awoken Warp-strike (Dual Shift)",
          "Noctis - Path of the True King",
          "Noctis - Heir to Greatness",
          "Noctis - Divine Revelation",
          "Noctis - Bringer of Dawn",
          "Noctis - Unwavering Friendship",
        ]
      `);
    });

    it('handles punctuation in character names', () => {
      expect(doSimpleSearch("Y'shtola")).toEqual(doSimpleSearch('Yshtola'));
    });

    it('searches for individual soul breaks', () => {
      expect(doSimpleSearch('cloud usb1')).toMatchInlineSnapshot(`
        Array [
          "Cloud - Ultra Cross Slash",
          "Cloud of Darkness - Wide-Angle Particle Beam",
        ]
      `);
    });
  });
});

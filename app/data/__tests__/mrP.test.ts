import { describeEnlirSoulBreak } from '../mrP';
import { parseNumberString } from '../mrP/util';

import { enlir } from '../enlir';

import * as _ from 'lodash';

const soulBreaks = _.keyBy(_.values(enlir.soulBreaks), i => i.character + ' - ' + i.name);

describe('mrP', () => {
  describe('parseNumberString', () => {
    it('parses number strings', () => {
      expect(parseNumberString('One')).toEqual(1);
      expect(parseNumberString('Twenty-two')).toEqual(22);
    });
  });

  describe('describeEnlirSoulBreak', () => {
    it('converts HP-draining attacks', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Cecil (Dark Knight) - Blood Weapon'])).toEqual({
        damage: 'phys 1.6',
        other: 'self heal 25% of dmg',
      });
    });

    it('converts Overstrikes', () => {
      // Deviation: MMP omits "overstrike" for OSBs.  But, as overstrike
      // on non-OSBs becomes more common, it makes sense to be consistent.
      expect(describeEnlirSoulBreak(soulBreaks['Cecil (Paladin) - Arc of Light'])).toEqual({
        damage: 'phys 12.0 holy+non ranged overstrike',
      });
    });

    it('converts 20+1 Arcane Overstrikes', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Luneth - Storm of Blades'])).toEqual({
        damage: 'phys 11.0/20, then overstrike 8.0, wind ranged',
      });
    });

    it('converts 3-hit Arcane Overstrikes', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Rinoa - Angel Wing Comet'])).toEqual({
        damage: 'magic 79.5/3 ice+earth overstrike',
      });
    });

    it('converts stacking infuse glints', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Luneth - Howling Winds'])).toEqual({
        instant: true,
        damage: 'phys 3.12/6 wind+non',
        other: 'wind infuse stacking 25s, wind infuse 25s',
      });
    });

    it('converts stat changes', () => {
      // Deviation: MMP omits durations here (to save space?) but includes them
      // for some effects.
      expect(describeEnlirSoulBreak(soulBreaks['Dorgann - Winds of Home'])).toEqual({
        damage: 'phys 7.68/6 wind',
        other: 'party +30% ATK/MAG 25s, self -30% DEF 25s',
      });
    });

    it('converts multiple self effects', () => {
      // Deviation: MMP lists some recoil as fractions instead of percents.
      expect(describeEnlirSoulBreak(soulBreaks['Cecil (Dark Knight) - Dark Flame'])).toEqual({
        damage: 'AoE phys 7.84/8 dark+fire',
        other: 'self lose 25% max HP, +30% ATK/RES 25s',
      });
    });

    it('converts summons', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Braska - Aeon of Storms'])).toEqual({
        damage: 'AoE magic 1.1/2 lgt (SUM)',
      });
    });

    it('converts heals plus status effects', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Sarah - Age-old Hymn'])).toEqual({
        other: 'party h55, Magic blink 1, self +30% RES/MND 25s',
      });
    });

    it('converts multiple statuses', () => {
      expect(describeEnlirSoulBreak(soulBreaks["Tyro - Warder's Apocrypha"])).toEqual({
        other: 'party Haste, Status blink 1, Autoheal 2k, self instacast 2',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Tyro - Divine Veil Grimoire'])).toEqual({
        other: 'party Haste, Protect, Shell, +200% DEF/RES 25s',
      });
    });

    it('converts multiple stat buffs', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Tyro - Fantasy Unbound'])).toEqual({
        damage: 'phys 6.29/17',
        other: 'party Haste, +15% A/D/M/R/MND 25s',
      });
    });

    it('converts EX modes and follow-up attacks', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Ace - Jackpot Triad'])).toEqual({
        damage: 'magic 17.0/10 fire+non',
        other:
          'fire infuse 25s, 15s: (any ability ⤇ 74-25-1% m0.55-1.1/2-7.15/13 f+n), 15s: EX: +30% MAG, fastcast',
      });
    });
  });
});

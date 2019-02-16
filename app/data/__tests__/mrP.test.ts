import { describeEnlirSoulBreak } from '../mrP';
import { parseNumberString, parsePercentageCounts } from '../mrP/util';

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

  describe('parsePercentageCounts', () => {
    it('parses percentage counts', () => {
      expect(
        parsePercentageCounts(
          'Randomly deals one (74%), two (25%) or thirteen (1%) single attacks',
        ),
      ).toEqual([[1, 74], [2, 25], [13, 1]]);
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
        damage: 'phys 11.0/20, then 8.0 overstrike, wind ranged',
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
      // Deviation: MMP describes this as
      // "hi fastcast 2, instant fire infuse stacking 25s, fire infuse 25s"
      expect(describeEnlirSoulBreak(soulBreaks['Krile - Boundless Love'])).toEqual({
        instant: true,
        other: 'fire infuse stacking 25s, fire infuse 25s, self hi fastcast 2',
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

    it('converts debuffs with buffs', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Barret - Height of Anger'])).toEqual({
        damage: 'phys 6.75/15 fire+wind ranged',
        other: '-70% DEF/RES 8s, party instacast 1',
      });
    });

    it('converts EX modes with simple follow-up attacks', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Squall - Brutal Blast'])).toEqual({
        damage: 'phys 7.47/9 ice+non',
        other: 'self hi fastcast 2, 15s: EX: (2 Spellblade ⤇ AoE p2.6/4 i+n Combat no miss)',
      });
    });

    it('converts EX modes with skill boosts and 100% hit rate follow-up attacks', () => {
      // Deviation: MMP often omits "no miss" (due to error? lack of space?)
      // and doesn't show "self" for Ability Boost.  However, it's probably
      // more consistent and certainly more thorough to include it.
      expect(describeEnlirSoulBreak(soulBreaks['Leo - Shock Imperial'])).toEqual({
        damage: 'phys 7.1/10 earth+holy',
        other:
          'party +30% ATK/DEF 25s, self 1.3x Knight dmg, 15s: (Knight ⤇ p1.96/4 e+h+n Knight no miss)',
      });
    });

    it('converts EX modes with random follow-up attacks', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Ace - Jackpot Triad'])).toEqual({
        damage: 'magic 17.0/10 fire+non',
        other:
          'fire infuse 25s, 15s: (any ability ⤇ 74-25-1% m0.55-1.1/2-7.15/13 f+n B.Mag), 15s: EX: +30% MAG, fastcast',
      });
    });

    it('converts EX modes with unusual follow-up attacks', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Cloud - Climirage'])).toEqual({
        damage: 'phys 7.2/15 wind',
        other:
          'wind infuse 25s, 15s: EX: +30% ATK, (wind ⤇ p1.6/4 or 3.2/8 wi+n overstrike Combat no miss)',
      });
    });

    it('converts percent heals', () => {
      // Deviation: MMP sometimes says "40%" or "40% HP" or "40% max HP"
      expect(describeEnlirSoulBreak(soulBreaks['Prishe - Rigorous Reverie'])).toEqual({
        other: 'party heal 40% HP, Regen (hi), Last stand',
      });
    });

    it('converts chains', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Krile - Unbroken Chain'])).toEqual({
        chain: 'fire chain 1.2x',
        damage: 'magic 17.93/11 fire',
        other: 'party fastcast 2',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Kain - Impulse Drive'])).toEqual({
        chain: 'lgt chain 1.2x',
        damage: 'phys 7.92/22 lgt jump',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Ace - We Have Arrived'])).toEqual({
        chain: 'Type-0 chain 1.5x',
        other: 'party Haste, +30% ATK/MAG 25s',
      });
    });

    it('converts conditional attacks', () => {
      // Deviation: MMP sometimes uses parentheses and sometimes ", or "
      expect(describeEnlirSoulBreak(soulBreaks['Ace - Firaga SHG'])).toEqual({
        damage: 'magic 14.0/8 fire+non, or m16.16/8 if in front row',
        other: 'party +30% ATK/MAG 25s',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Zidane - Meo Twister'])).toEqual({
        damage: 'phys 11.8 wind+non overstrike, or p12.8 if 4 females in party',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Steiner - Imbued Blade'])).toEqual({
        damage: 'phys 10.5 fire+lgt+ice overstrike, or p13.0 vs. weak',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Matoya - Inner Eye'])).toEqual({
        damage: 'magic 16.0/8 fire+ice+lgt, or m20.0/10 vs. weak',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Beatrix - Knight Protector'])).toEqual({
        damage: 'AoE phys 5.48/4 holy, or p6.12/4 if no allies KO',
        other: '+20% holy vuln. 25s',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Kuja - Final Requiem'])).toEqual({});
      expect(describeEnlirSoulBreak(soulBreaks['Lann - Mega Mirage Zantetsuken'])).toEqual({});
      expect(describeEnlirSoulBreak(soulBreaks['Mustadio - Seal Evil (FFT)'])).toEqual({});
    });
  });
});

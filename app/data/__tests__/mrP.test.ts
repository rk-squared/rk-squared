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
        damage: 'phys 12.0 holy+non rngd overstrike',
      });
    });

    it('converts 20+1 Arcane Overstrikes', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Luneth - Storm of Blades'])).toEqual({
        damage: 'phys 11.0/20, then 8.0 overstrike, wind rngd',
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

      expect(describeEnlirSoulBreak(soulBreaks['- - Rend Weapon'])).toEqual({
        damage: 'AoE phys 1.4',
        other: '-30% ATK 20s',
      });
    });

    it('converts multiple self effects', () => {
      // Deviation: MMP lists some recoil as fractions instead of percents.
      expect(describeEnlirSoulBreak(soulBreaks['Cecil (Dark Knight) - Dark Flame'])).toEqual({
        damage: 'AoE phys 7.84/8 dark+fire',
        other: 'self lose 25% max HP, +30% ATK/RES 25s',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Alma - Sacred Barrier'])).toEqual({
        other: 'party Haste, Protect, Shell, Regen (hi), Status blink 1, Reraise 40%',
      });
      expect(describeEnlirSoulBreak(soulBreaks["Alma - Cleric's Prayer"])).toEqual({
        other: 'party -10% holy vuln. 15s, Autoheal 3k',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Alma - Angelic Vessel'])).toEqual({
        instant: true,
        other: 'party h85, Negate dmg 100% (dark only), Autoheal 2k',
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
      expect(describeEnlirSoulBreak(soulBreaks['Alma - Gentle Chant'])).toEqual({
        other: 'ally h45, self +20% MND 25s',
      });
    });

    it('converts multiple statuses', () => {
      expect(describeEnlirSoulBreak(soulBreaks["Tyro - Warder's Apocrypha"])).toEqual({
        other: 'party Haste, Status blink 1, Autoheal 2k, self instacast 2',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Tyro - Divine Veil Grimoire'])).toEqual({
        other: 'party Haste, Protect, Shell, +200% DEF/RES 25s',
      });

      // Discrepancy: MMP lists Reflect Dmg second.  Unless we want to try and
      // separate "exotic" statuses from "common" statuses, that's inconsistent
      // with other soul breaks.
      expect(describeEnlirSoulBreak(soulBreaks['Alphinaud - Deployment Tactics'])).toEqual({
        other: 'party Reflect Dmg 30s, +30% ATK/MAG 25s',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Angeal - Thunder of Envy'])).toEqual({
        instant: true,
        other: 'party Negate dmg 30% 25s, +100% RES 25s',
      });
    });

    it('converts combinations of stat changes, statuses, and infuses', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Agrias - Loyal Blade'])).toEqual({
        damage: 'phys 7.1/10 holy+non',
        other: '-50% ATK/MAG 25s, holy infuse 25s, self 1.15x Knight dmg 25s',
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
        damage: 'phys 6.75/15 fire+wind rngd',
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
      //
      // Deviation: MMP shows 15s before some statuses (like this Knight boost)
      // and after others (more "standard" statuses).  We'll consistently go
      // after, except for those that are specialized (clearly custom to USB).
      expect(describeEnlirSoulBreak(soulBreaks['Leo - Shock Imperial'])).toEqual({
        damage: 'phys 7.1/10 earth+holy',
        other:
          'party +30% ATK/DEF 25s, self 1.3x Knight dmg 15s, 15s: (Knight ⤇ p1.96/4 e+h+n Knight no miss)',
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

      expect(describeEnlirSoulBreak(soulBreaks['Agrias - Divine Devastation'])).toEqual({
        damage: 'phys 6.7/10 holy+non',
        other: '+20% holy vuln. 25s, 15s: (2 Knight ⤇ +10% holy vuln. 15s)',
      });
    });

    it('converts percent heals', () => {
      // Deviation: MMP sometimes says "40%" or "40% HP" or "40% max HP"
      expect(describeEnlirSoulBreak(soulBreaks['Prishe - Rigorous Reverie'])).toEqual({
        other: 'party heal 40% HP, Regen (hi), Last stand',
      });
    });

    it('converts revives', () => {
      expect(describeEnlirSoulBreak(soulBreaks['- - Mending Touch'])).toEqual({
        other: 'revive @ 20% HP',
      });

      expect(describeEnlirSoulBreak(soulBreaks["Iris - Amicitia's Cheer"])).toEqual({
        instant: true,
        other: 'party h85, Haste, revive @ 40% HP, self hi fastcast 15s',
      });
    });

    it('converts chains', () => {
      // Deviation: Now that Chain 2.0s are a thing, adding the max chain count
      // seems useful, even if MMP didn't do it.
      expect(describeEnlirSoulBreak(soulBreaks['Krile - Unbroken Chain'])).toEqual({
        chain: 'fire chain 1.2x (max 99)',
        damage: 'magic 17.93/11 fire',
        other: 'party fastcast 2',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Kain - Impulse Drive'])).toEqual({
        chain: 'lgt chain 1.2x (max 99)',
        damage: 'phys 7.92/22 lgt jump',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Ace - We Have Arrived'])).toEqual({
        chain: 'Type-0 chain 1.5x (max 150)',
        other: 'party Haste, +30% ATK/MAG 25s',
      });
    });

    it('converts status ailments', () => {
      expect(describeEnlirSoulBreak(soulBreaks["Seymour - Anima's Pain"])).toEqual({
        damage: 'magic 17.44/8 dark+non (SUM)',
        other: '53% (9% × 8) KO, +20% dark vuln. 25s',
      });
      // 'Mustadio - Seal Evil (FFT)' below has some additional checks.
    });

    it('handles Dispel and Esuna', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Shelke - Countertek'])).toEqual({
        other: 'AoE Dispel, party Esuna, Regen (hi)',
      });
    });

    it('converts scaling attacks', () => {
      // Deviation: MMP lists 'self heal 70% max HP' first
      expect(describeEnlirSoulBreak(soulBreaks['Seifer - Forbidden Fellslash'])).toEqual({
        damage: 'phys 6.58/7 dark+fire, up to p10.5 @ 1% HP',
        other: 'dark infuse 25s, self heal 70% HP',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Luneth - Heavenly Gust'])).toEqual({
        damage: 'phys 11.2 wind+non jump overstrike, up to p14.5 w/ wind atks used',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Paine - Grand Storm'])).toEqual({
        damage: 'AoE phys 5.4/6 water+earth+wind, up to p6.6 w/ Spellblade used',
        other: 'Dispel',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Jecht - Blitz King'])).toEqual({
        damage: 'phys 11.7 dark+fire rngd overstrike, up to p13.0 @ 6 SB bars',
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
      expect(describeEnlirSoulBreak(soulBreaks['Kuja - Final Requiem'])).toEqual({
        damage: 'magic 38.0 dark+non overstrike, or m44.0 if Doomed',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Lann - Mega Mirage Zantetsuken'])).toEqual({
        damage: 'phys 12.6 overstrike, or p13.6 if Reynn alive',
        other: '60% KO',
      });
      // This also has some required checks for status ailment handling.
      expect(describeEnlirSoulBreak(soulBreaks['Mustadio - Seal Evil (FFT)'])).toEqual({
        damage: 'phys 7.92/8, or p8.56/8 vs. status',
        other: '100% Stop/Silence/Paralyze',
      });
    });

    it('converts quick cycle and critical hit buffs', () => {
      // Deviation: MMP lists the critical buff as 25s, which appears to be
      // correct, but Enlir doesn't confirm it.
      expect(describeEnlirSoulBreak(soulBreaks['Jecht - Ultimate Jecht Rush'])).toEqual({
        damage: 'phys 7.1/10 dark+non rngd',
        other: 'self +30% ATK/DEF 25s, crit =75%, fastcast 1, 15s: (dark ⤇ fastcast 1)',
      });
    });

    it('converts finishers', () => {
      // Discrepancy: This format for finishers differs somewhat...
      expect(describeEnlirSoulBreak(soulBreaks['Alphinaud - Teraflare'])).toEqual({
        damage: 'AoE magic 16.1/7 wind+dark (SUM)',
        other:
          'wind infuse 25s, 15s: EX: 1.05-1.1-1.15-1.2-1.3x SUM dmg @ ranks 1-5, ' +
          'Finisher: AoE magic 35% SUM/5 Summon, self refill 2 abil. use',
      });
    });

    it('converts AASBs', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Agrias - Holy Cross Blade'])).toEqual({
        damage: 'phys 9.0/15 holy+non',
        other:
          'holy infuse 25s, self dmg cap=19,999 15s, 15s: (2 Knight ⤇ +10% holy vuln. 15s), ' +
          '15s: Awaken Knight: Knight inf. hones, up to 1.3x dmg @ rank 5, 100% dualcast',
      });
      // TODO: Add checks for more Awaken modes
      // TODO: Decide about Awaken modes whose statuses duplicate trances, etc.
    });

    it('handles turn-limited boosts', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Amarant - Exploding Fist'])).toEqual({
        instant: true,
        damage: 'phys 6.2/10 lgt+fire+non',
        other: '+20% fire vuln. 25s, +20% lgt vuln. 25s, self Monk hi fastcast 2',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Onion Knight - Onion Soul'])).toEqual({
        instant: true,
        other: '1.3x dmg vs weak 15s, hi fastcast 2',
      });
      // This also tests elemental infuse with the Oxford comma.
      expect(describeEnlirSoulBreak(soulBreaks["Amarant - Outlaw's Spirit"])).toEqual({
        instant: true,
        other: 'fire infuse stacking 25s, fire infuse 25s, self crit =100% 2 turns',
      });
    });
  });
});

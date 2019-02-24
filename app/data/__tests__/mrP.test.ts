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
    it('converts random attacks', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Cait Sith - Toy Soldier'])).toEqual({
        damage: 'AoE white 7.11/3 or ?/3 or 9.48/3 or 11.85/3',
        other: '-50% ATK/MAG 25s',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Cait Sith - Dice (VII)'])).toEqual({
        damage: '1, 22, 33, 444, 555 or 6666 fixed dmg',
      });
    });

    it('converts HP-draining attacks', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Cecil (Dark Knight) - Blood Weapon'])).toEqual({
        damage: 'phys 1.6',
        other: 'self heal 25% of dmg',
      });
    });

    it('converts Overstrikes', () => {
      // Deviation: MrP omits "overstrike" for OSBs.  But, as overstrike
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
      // Deviation: MrP describes this as
      // "hi fastcast 2, instant fire infuse stacking 25s, fire infuse 25s"
      expect(describeEnlirSoulBreak(soulBreaks['Krile - Boundless Love'])).toEqual({
        instant: true,
        other: 'fire infuse stacking 25s, fire infuse 25s, self hi fastcast 2',
      });
    });

    it('converts stat changes', () => {
      // Deviation: MrP omits durations here (to save space?) but includes them
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

    it('converts multiple status effects', () => {
      // Deviation: MrP lists some recoil as fractions instead of percents.
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

    it('converts self effects', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Balthier - Element of Treachery'])).toEqual({
        damage: 'phys 5.1/10 rngd',
        other: 'self Phys blink 2',
      });
    });

    it('converts summons', () => {
      // Discrepancy: MrP doesn't include minimum damage, but it seems
      // useful.
      expect(describeEnlirSoulBreak(soulBreaks['Braska - Aeon of Storms'])).toEqual({
        damage: 'AoE magic 1.1/2 lgt, min dmg 55 (SUM)',
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

      // Discrepancy: MrP lists Reflect Dmg second.  Unless we want to try and
      // separate "exotic" statuses from "common" statuses, that's inconsistent
      // with other soul breaks.
      expect(describeEnlirSoulBreak(soulBreaks['Alphinaud - Deployment Tactics'])).toEqual({
        other: 'party Reflect Dmg 30s, +30% ATK/MAG 25s',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Angeal - Thunder of Envy'])).toEqual({
        instant: true,
        other: 'party Negate dmg 30%, +100% RES 25s',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Angeal - Rage of Sloth'])).toEqual({
        damage: 'phys 7.1/10 holy+wind',
        other: 'party 50% Dmg barrier 2, Regenga, self crit =100% 25s',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Auron - Miracle Blade'])).toEqual({
        instant: true,
        damage: 'phys 3.12/6 fire+non',
        other: '+10% fire vuln. 25s, -50% DEF 15s',
      });

      // Discrepancy: MrP sometimes lists this as "crit dmg=2x".
      expect(describeEnlirSoulBreak(soulBreaks['Ayame - Hagakure Yukikaze'])).toEqual({
        damage: 'phys 7.1/10 ice+non',
        other: 'ice infuse 25s, self Retaliate @p1.2 15s, +50% crit dmg 25s',
      });
    });

    it('converts combinations of stat changes, statuses, and infuses', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Agrias - Loyal Blade'])).toEqual({
        damage: 'phys 7.1/10 holy+non',
        other: '-50% ATK/MAG 25s, holy infuse 25s, self 1.15x Knight dmg 25s',
      });
    });

    it('converts custom stat mods', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Delita - King Apparent'])).toEqual({
        damage: 'phys 6.7/10 holy+fire+lgt+ice, or p7.7/10 vs. weak',
        other: 'self +30% ATK, +25% RES, crit =50% 25s, instacast 2',
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

    it('converts non-standard debuffs', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Wol - Overkill'])).toEqual({
        damage: 'phys 7.68/8 rngd',
        other: 'Dispel, -70% DEF/RES 8s',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Zidane - Wall of Light'])).toEqual({
        other: 'party Regen (hi), +25% DEF/RES 25s',
      });
    });

    it('converts EX modes with simple follow-up attacks', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Squall - Brutal Blast'])).toEqual({
        damage: 'phys 7.47/9 ice+non',
        other: 'self hi fastcast 2, 15s: EX: (2 Spellblade ⤇ AoE p2.6/4 i+n Combat)',
      });

      // Deviation: MrP doesn't always use 1-letter abbreviations for
      // follow-ups.  E.g., this is "lg+d+n."
      expect(describeEnlirSoulBreak(soulBreaks['Aranea - Dragon Leap'])).toEqual({
        damage: 'phys 7.1/10 lgt+dark jump',
        other:
          'lgt infuse 25s, self +30% ATK/DEF 25s, ' +
          '15s: (Dragoon dmg ⤇ p1.9/5 l+d+n rngd Dragoon)',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Ursula - Crushing Fist'])).toEqual({
        damage: 'phys 7.1/10 earth+fire',
        other: 'earth infuse 25s, 15s: fastcast, (crit ⤇ p2.05/5 e+f+n Monk)',
      });
    });

    it('converts EX modes with rank chases', () => {
      expect(describeEnlirSoulBreak(soulBreaks["Arc - Water's Grace"])).toEqual({
        damage: 'white 18.0/10 holy+water',
        other:
          'holy infuse 25s, self +30% RES/MND 25s, ' +
          '15s: (holy ⤇ w3.26/2 - 4.89/3 - 6.52/4 - 8.15/5 - 9.78/6 h+wa+n W.Mag @ rank 1-5)',
      });
    });

    it('converts HP thresholds', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Cecil (Dark Knight) - Evil Blade'])).toEqual({
        damage: 'phys 10.75 - 11.5 - 13.0 - 15.0 - 17.0 dark+non overstrike @ 80-50-20-6% HP',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Locke - Burning Spirit'])).toEqual({
        damage: 'phys 7.1/10 fire+non rngd',
        other:
          'fire infuse 25s, self instacast 1, 15s: EX: +30% ATK, ' +
          '(fire ⤇ p1.4/4 - 1.75/5 - 2.1/6 - 2.45/7 - 2.8/8 f+n rngd Thief @ 100-80-60-40-20% HP)',
      });
    });

    it('converts stat thresholds', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Braska - Aeons of Wing and Flame'])).toEqual({
        damage:
          'AoE magic 14.4/6 - 16.8/7 - 19.2/8 - 21.6/9 fire+non @ 562-681-723 MAG, min dmg 800 (SUM)',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Onion Knight - Onion Slice'])).toEqual({
        damage: 'phys 6.56/8 - 7.38/9 - 8.2/10 - 9.02/11 @ 140-175-190 SPD',
        other: '-50% DEF/RES 25s',
      });
    });

    it('handles stoneskin, dual-cast, double-cast', () => {
      // Discrepancy: MrP formats this more like 'EX: until Neg. Dmg. lost:'
      expect(describeEnlirSoulBreak(soulBreaks['Cecil (Dark Knight) - Endless Darkness'])).toEqual({
        damage: 'phys 7.1/10 dark+non',
        other:
          'dark infuse 25s, self lose 99% max HP, Negate dmg 100%, ' +
          'until Neg. Dmg. lost: EX: +30% ATK, Darkness hi fastcast, 100% dualcast Darkness',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Golbez - Onyx Dragon'])).toEqual({
        damage: 'magic 17.0/10 dark+non',
        other:
          'dark infuse 25s, self lose 99% max HP, Negate dmg 100%, ' +
          'until Neg. Dmg. lost: 100% dualcast Darkness, ' +
          'Finisher: magic 11.8 - 20.5 - 34.6 dark+non overstrike Darkness',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Maria - Magma XXXII'])).toEqual({
        damage: 'magic 17.0/10 earth+non',
        other: 'earth infuse 25s, self double B.Mag (use extra hone) 15s, +30% DEF/MAG 25s',
      });
    });

    it('converts EX modes with skill boosts and 100% hit rate follow-up attacks', () => {
      // Deviation: MrP often omits "no miss" (due to error? lack of space?)
      // and doesn't show "self" for Ability Boost.  However, it's probably
      // more consistent and certainly more thorough to include it.
      //
      // Deviation: MrP shows 15s before some statuses (like this Knight boost)
      // and after others (more "standard" statuses).  We'll consistently go
      // after, except for those that are specialized (clearly custom to USB).
      expect(describeEnlirSoulBreak(soulBreaks['Leo - Shock Imperial'])).toEqual({
        damage: 'phys 7.1/10 earth+holy',
        other:
          'party +30% ATK/DEF 25s, self 1.3x Knight dmg 15s, 15s: (Knight ⤇ p1.96/4 e+h+n Knight)',
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
          'wind infuse 25s, 15s: EX: +30% ATK, (wind ⤇ p1.6/4 or 3.2/8 wi+n overstrike Combat)',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Agrias - Divine Devastation'])).toEqual({
        damage: 'phys 6.7/10 holy+non',
        other: '+20% holy vuln. 25s, 15s: (2 Knight ⤇ +10% holy vuln. 15s)',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Arc - Summon Leviathan'])).toEqual({
        damage: 'magic 17.0/10 water+non (SUM)',
        other:
          'water infuse 25s, 15s: EX: +30% MAG, (2 W.Mag/Summon ⤇ m7.95/5 wa+n Summon, party h25)',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Ace - Firaga BOM'])).toEqual({
        damage: 'magic 17.0/10 fire+non',
        other:
          'fire infuse 25s, self 1.3x B.Mag dmg 15s, ' +
          '15s: (1/2/3 B.Mag ⤇ m4.08/2 f+n B.Mag, self hi fastcast 2 – m4.08/2 f+n B.Mag – m16.32/8 f+n B.Mag)',
      });
    });

    it('converts follow-ups with varying elements', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Bartz - Chosen Traveler'])).toEqual({
        damage: 'phys 7.0/10 wind+water+fire+earth',
        other:
          '15s: EX: +30% ATK, fastcast, ' +
          '(wi/wa/f/e Spellblade dmg ⤇ p0.8/2 or 3.2/8 wi/wa/f/e+n Spellblade)',
      });

      // This also verifies attacks that inflict imperils.
      expect(describeEnlirSoulBreak(soulBreaks['Edgar - Royal Brotherhood'])).toEqual({
        damage: 'phys 7.0/10 bio+fire+lgt rngd',
        other:
          'self 1.05-1.1-1.15-1.2-1.3x Machinist dmg @ ranks 1-5 15s, ' +
          '15s: EX: +30% ATK, Machinist fastcast, ' +
          '(b/f/l Machinist dmg ⤇ p1.17/3 b/f/l+n Machinist, 35% for +10% bio/fire/lgt vuln. 15s)',
      });
    });

    it('converts follow-ups with varying effects', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Setzer - Ultimate Gamble'])).toEqual({
        damage: 'phys 7.1/10 dark+non rngd',
        other:
          '-70% DEF/MAG 8s, party instacast 1, ' +
          '15s: (1/2/3/4 + 4n damaging Support ⤇ p1.71/3 d+n rngd Support, -40% ATK/-50% MAG/-40% DEF/-50% RES 15s)',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Exdeath - Laws of Black and White'])).toEqual({
        damage: 'magic 17.0/10 dark+holy',
        other:
          'self +30% holy/dark dmg 15s, +30% MAG/RES/MND 25s, ' +
          '15s: (1/2/3 W.Mag/Darkness ⤇ m5.2/4 d+h+n Darkness – ' +
          'm7.8/6 d+h+n Darkness, self heal 10% of dmg – ' +
          'm20.2 d+h+n overstrike Darkness, self heal 10% of dmg)',
      });

      expect(describeEnlirSoulBreak(soulBreaks["Bartz - Crystals' Chosen"])).toEqual({
        damage: 'phys 6.9/10 wind+water+fire+earth',
        other:
          '15s: EX: (0-8 wind/water/fire/earth ⤇ 1.3-1.35-1.4-1.45-1.5-1.55-1.6-1.65-1.7x Spellblade dmg), ' +
          'Finisher: phys 35% Spellblade overstrike Spellblade',
      });
    });

    it('converts EX modes with follow-up statuses', () => {
      // Deviation: MrP variously describes abilities like Minor Buff Lightning
      // as "+3 elem attack level" or "stackable +20% earth dmg"
      expect(describeEnlirSoulBreak(soulBreaks['Ashe - Thunder of Innovation'])).toEqual({
        damage: 'magic 17.0/10 lgt+non',
        other:
          'lgt infuse 25s, ' +
          '15s: (lgt ⤇ back row hi fastzap 1), ' +
          '(3 lgt ⤇ party +10% lgt dmg)',
      });
    });

    it('converts auto skills', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Braska - Twin Summoning'])).toEqual({
        damage: 'magic 17.0/10 fire+lgt (SUM)',
        other: 'self 1.3x Summon dmg 15s, 15s: (every 3.5s ⤇ AoE m6.8/4 f+l Summon, min dmg 1100)',
      });
    });

    it('converts ultras with status sequences', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Auron - Lost Arts'])).toEqual({
        damage: 'phys 7.1/10 fire+non',
        other:
          'fire infuse 25s, 15s: Finisher: phys 35% fire overstrike Samurai, ' +
          '15s: (Samurai ⤇ crit =30-50-75%, 2-2.5-3x cast)',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Sice - Dark Nebula'])).toEqual({
        damage: 'phys 7.1/10 dark+non',
        other:
          'dark infuse 25s, 15s: Finisher: phys 35% dark overstrike Darkness, ' +
          '15s: (Darkness ⤇ crit =30-50-75%, 2-2.5-3x cast)',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Hope - Reflect Boomerang'])).toEqual({
        damage: 'magic 17.3/10 holy (SUM)',
        other:
          'party Reflect Dmg 75% as holy 30s, ' +
          '15s: Finisher: magic 11.8 - 20.5 - 34.6 holy+non overstrike Summon, refill 0/1/2 abil. use, ' +
          '(holy ⤇ 2-2.5-3x zap)',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Vivi - Clamorous Magic'])).toEqual({
        damage: 'magic 16.5/10 ice+water+lgt+non',
        other:
          'self fastcast 15s, ' +
          '15s: (B.Mag ⤇ MAG +30-34-38-42-46-50%), ' +
          '15s: EX: (B.Mag ⤇ m7.68/6 i+wa+l+n B.Mag), ' +
          'Finisher: magic 17.3/10 ice+water+lgt+non B.Mag',
      });
    });

    it('converts percent heals', () => {
      // Deviation: MrP sometimes says "40%" or "40% HP" or "40% max HP"
      expect(describeEnlirSoulBreak(soulBreaks['Prishe - Rigorous Reverie'])).toEqual({
        other: 'party heal 40% HP, Regen (hi), Last stand',
      });
    });

    it('converts fixed heals', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Cecil (Paladin) - Paladin Wall'])).toEqual({
        other: 'party +200% DEF/RES 25s, 15s: EX: +30% ATK/DEF, (Knight ⤇ front row heal 1.5k HP)',
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
      // seems useful, even if MrP didn't do it.
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
      // Deviation: MrP lists 'self heal 70% max HP' first
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
      // Deviation: MrP sometimes uses parentheses and sometimes ", or "
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
      // Deviation: MrP lists the critical buff as 25s, which appears to be
      // correct, but Enlir doesn't confirm it.
      expect(describeEnlirSoulBreak(soulBreaks['Jecht - Ultimate Jecht Rush'])).toEqual({
        damage: 'phys 7.1/10 dark+non rngd',
        other: 'self +30% ATK/DEF 25s, crit =75%, fastcast 1, 15s: (dark ⤇ fastcast 1)',
      });
    });

    it('converts finishers', () => {
      // Deviation: This format for finishers differs somewhat...
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
      expect(describeEnlirSoulBreak(soulBreaks['Noctis - Kingly Duties'])).toEqual({
        damage: 'phys 9.0/15 fire+earth+lgt+non',
        other:
          'self crit =100% 25s, dmg cap=19,999 15s, ' +
          '15s: hi fastcast, ' +
          'Finisher: phys 3.1 - 6.2 - 9.7 fire+earth+lgt+non overstrike Combat, ' +
          '15s: Awaken Lucis King: fire/earth/lgt inf. hones, up to 1.3x dmg @ rank 5, 100% dualcast',
      });

      // This also helps test the interaction of status effects and stat mods,
      // because of the "causes DEF, RES and MND -70% for 8 seconds" follow-up.
      expect(describeEnlirSoulBreak(soulBreaks['Auron - Living Flame'])).toEqual({
        damage: 'phys 9.0/15 fire+non',
        other:
          'fire infuse 25s, self dmg cap=19,999 15s, ' +
          '15s: (3 Samurai ⤇ p5.28 f+n overstrike Samurai, -70% DEF/RES/MND 8s), ' +
          '15s: Awaken Samurai: Samurai inf. hones, up to 1.3x dmg @ rank 5, 100% dualcast',
      });

      // TODO: Add checks for more Awaken modes
      // TODO: Decide about Awaken modes whose statuses duplicate trances, etc.
    });

    it('handles turn-limited effects', () => {
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

    it('handles ether abilities', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Xezat - Spellsword Iceshock'])).toEqual({
        damage: 'phys 7.92/6 ice+lgt',
        other: 'party refill 1 abil. use',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Arc - Heavenly Aria'])).toEqual({
        instant: true,
        other: 'Summon hi fastcast 15s, refill 2 Summon abil. use',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Gaffgarion - Duskblade'])).toEqual({
        damage: 'AoE phys 5.88/4 dark+non rngd',
        other: 'party refill 1 abil. use',
      });
    });

    it('handles NAT abilities', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Hope - Brutal Sanction'])).toEqual({
        damage: 'magic 10.5/3 (NAT)',
        other: '88% (50% × 3) Stop',
      });
    });
  });
});

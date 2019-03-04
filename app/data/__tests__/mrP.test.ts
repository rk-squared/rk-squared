import * as _ from 'lodash';

import { describeEnlirSoulBreak, formatMrP } from '../mrP';
import { formatBraveCommands } from '../mrP/brave';
import { parseNumberString, parsePercentageCounts } from '../mrP/util';

import { enlir, EnlirSoulBreak } from '../enlir';

const soulBreaks = _.keyBy(_.values(enlir.soulBreaks), i => i.character + ' - ' + i.name);

const unknownSoulBreaks: EnlirSoulBreak[] = [
  {
    realm: 'KH',
    character: 'Axel',
    name: 'Explosion',
    type: 'NAT',
    target: 'Single enemy',
    formula: 'Hybrid',
    multiplier: null,
    element: ['Fire', 'Wind', 'NE'],
    time: null,
    effects:
      'Fifteen single ranged hybrid attacks (? or ? each), grants Attach Fire, Awoken Fire, Damage Cap 19999 and Fiery Tornado Follow-Up to the user',
    counter: false,
    autoTarget: '?',
    points: 500,
    tier: 'AASB',
    master: 'ATK +5, MAG +5',
    relic: 'Wildfire (KH)',
    nameJp: 'エクスプロージョン',
    id: 23410001,
    gl: false,
  },
  {
    realm: 'KH',
    character: 'Axel',
    name: 'Burst Inferno',
    type: 'NAT',
    target: '?',
    formula: 'Hybrid',
    multiplier: null,
    element: ['Fire', 'Wind'],
    time: null,
    effects: 'Three single attacks (? each) capped at 99999',
    counter: false,
    autoTarget: '?',
    points: 750,
    tier: 'AOSB',
    master: 'ATK +5, MAG +5',
    relic: 'Eternal Flames (KH)',
    nameJp: 'バーストインフェルノ',
    id: 23410002,
    gl: false,
  },
  {
    realm: 'KH',
    character: 'Axel',
    name: 'Dance Flurry',
    type: 'NAT',
    target: '?',
    formula: 'Hybrid',
    multiplier: null,
    element: [],
    time: null,
    effects:
      'Ten single ranged hybrid attacks (? each), grants Attach Fire, Quick Cast 1 and Firetooth Follow-Up to the user',
    counter: false,
    autoTarget: '?',
    points: 500,
    tier: 'USB',
    master: 'ATK +5, MAG +5',
    relic: 'Prominence (KH)',
    nameJp: '乱舞',
    id: 23410003,
    gl: false,
  },
  {
    realm: 'KH',
    character: 'Axel',
    name: 'Fire Wall',
    type: 'NAT',
    target: 'Single enemy',
    formula: 'Hybrid',
    multiplier: null,
    element: ['Fire', 'Wind', 'NE'],
    time: 0.01,
    effects:
      'Six single ranged hybrid attacks (? each), grants Attach Fire Stacking and Attach Fire to the user',
    counter: false,
    autoTarget: '?',
    points: 250,
    tier: 'Glint',
    master: 'ATK +5, MAG +5',
    relic: 'Magma Ocean (KH)',
    nameJp: 'ファイアウォール',
    id: 23410004,
    gl: false,
  },
  {
    realm: 'XIII',
    character: 'Cid Raines',
    name: 'Dark Shift',
    type: '?',
    target: 'Self',
    formula: null,
    multiplier: null,
    element: null,
    time: 0.01,
    effects: 'MAG and RES +?% for ? seconds, grants Darkness High Quick Cast for ? seconds',
    counter: false,
    autoTarget: '?',
    points: 250,
    tier: 'Glint',
    master: 'MAG +10',
    relic: "Magician's Mark (XIII)",
    nameJp: 'ダークシフト',
    id: 22410011,
    gl: false,
  },
  {
    realm: 'II',
    character: 'Josef',
    name: 'Heroic Fist',
    type: '?',
    target: 'Single enemy',
    formula: 'Physical',
    multiplier: null,
    element: ['Ice', 'NE'],
    time: null,
    effects:
      'Ten single attacks (? each), causes Imperil Ice ?%, grants Ice Radiant Shield: 75% to all allies, grants Attach Ice and Quick Cast 3 to the user',
    counter: false,
    autoTarget: '?',
    points: 500,
    tier: 'USB',
    master: 'ATK +10',
    relic: 'Tiger Fangs (II)',
    nameJp: '漢の拳骨',
    id: 20190009,
    gl: false,
  },
  {
    realm: 'VII',
    character: 'Tifa',
    name: 'Beat Blast',
    type: '?',
    target: 'Single enemy',
    formula: 'Physical',
    multiplier: null,
    element: ['Earth', 'NE'],
    time: 0.01,
    effects:
      'Six single attacks (? each), causes Imperil Earth 10?% for 15? seconds, grants Minor Buff Earth to the user',
    counter: false,
    autoTarget: '?',
    points: 250,
    tier: 'Glint',
    master: 'ATK +10',
    relic: 'Hyper Fist (VII)',
    nameJp: '掌打破岩',
    id: 20230014,
    gl: false,
  },
];

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
    it('converts piercing attacks', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Sephiroth - Reunion'])).toEqual({
        damage: 'AoE phys 6.16/4',
        other: undefined,
        burstCommands: [
          { damage: 'p^24.5/2', other: undefined, school: 'Combat' },
          { damage: 'p2.52/4 f+n', other: undefined, school: 'Combat' },
        ],
      });
    });

    it('converts random attacks', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Cait Sith - Toy Soldier'])).toEqual({
        damage: 'AoE white 7.11/3 or ?/3 or 9.48/3 or 11.85/3',
        other: '-50% ATK/MAG 25s',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Cait Sith - Dice (VII)'])).toEqual({
        damage: '1, 22, 33, 444, 555 or 6666 fixed dmg',
      });
    });

    it('converts random effects', () => {
      // Discrepancy: MrP doesn't always expand these.  Should we?
      expect(describeEnlirSoulBreak(soulBreaks['Summoner - Call I'])).toEqual({
        damage: '25-50-25% m2.7, min dmg 600 / m2.7 f, min dmg 600 / m5.4, min dmg 1000',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Summoner - Call II'])).toEqual({
        damage: 'Goblin or Chocobo or Ifrit or Shiva or Ramuh',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Tellah - Recall'])).toEqual({
        damage: 'm2.9 f or m2.9 i or m2.9 l',
      });
    });

    it('converts HP-draining attacks', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Cecil (Dark Knight) - Blood Weapon'])).toEqual({
        damage: 'phys 1.6',
        other: 'self heal 25% of dmg',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Gabranth - Innocence'])).toEqual({
        damage: 'phys 7.68/8 dark+non rngd',
        other: '+20% dark vuln. 25s',
        burstCommands: [
          { fast: true, damage: 'p1.88/4 d+n', other: undefined, school: 'Combat' },
          { damage: 'p2.2 d+n', other: 'self heal 20% of dmg', school: 'Darkness' },
        ],
      });
    });

    it('converts Overstrikes', () => {
      // Deviation: MrP omits "overstrike" for OSBs.  But, as overstrike
      // on non-OSBs becomes more common, it makes sense to be consistent.
      expect(describeEnlirSoulBreak(soulBreaks['Cecil (Paladin) - Arc of Light'])).toEqual({
        damage: 'phys 12.0 holy+non rngd overstrike',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Locke - Miracle of Kohlingen'])).toEqual({
        fast: true,
        damage: 'phys 10.0 fire+holy rngd overstrike',
        other: undefined,
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

      expect(describeEnlirSoulBreak(soulBreaks['Celes - Magic Shield'])).toEqual({
        other: 'party +50% RES 25s',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Luneth - Advance'])).toEqual({
        other: 'self +150% ATK, -50% DEF 30s',
      });
    });

    it('converts multiple status effects', () => {
      // Deviation: MrP lists some recoil as fractions instead of percents.
      expect(describeEnlirSoulBreak(soulBreaks['Cecil (Dark Knight) - Dark Flame'])).toEqual({
        damage: 'AoE phys 7.84/8 dark+fire',
        other: 'self lose 25% max HP, +30% ATK/RES 25s',
        burstCommands: [
          {
            damage: 'p2.16/4 d+n, uses +ATK as HP falls',
            school: 'Darkness',
          },
          {
            damage: 'AoE p2.0/2 d+n',
            other: 'self lose 12.5% max HP',
            school: 'Darkness',
          },
        ],
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

      expect(describeEnlirSoulBreak(soulBreaks['Palom - Tri-Disaster'])).toEqual({
        damage: 'magic 16.0/8 fire+lgt+ice, or m20.0/10 vs. weak',
        burstCommands: [
          {
            damage: 'm9.2/4 f+l',
            other: 'self instazap 1 if hits weak',
            school: 'Black Magic',
          },
          {
            damage: 'm9.2/4 i+l',
            other: 'self instazap 1 if hits weak',
            school: 'Black Magic',
          },
        ],
      });
    });

    it('converts status effects that scale with uses', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Biggs - Saintrock Cleft'])).toEqual({
        damage: 'phys 7.0/10 earth+holy+non',
        other:
          'self 1.3x/1.5x/1.7x PHY dmg w/ 0-1-2 uses 15s, ' +
          '15s: (earth/holy ⤇ p2.0 e+h+n overstrike Heavy)',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Zidane - Solution 9'])).toEqual({
        damage: 'phys 6.66/9 wind+non rngd',
        other: 'wind infuse 25s',
        burstCommands: [
          {
            damage: 'p2.4/2 wi+n rngd',
            other: 'powers up cmd 2, -10%/-20%/-30%/-30% ATK, self +10%/20%/30%/30% ATK',
            school: 'Thief',
          },
          {
            damage: 'p2.4/2 wi+n rngd',
            other: 'party +0%/10%/20%/30% ATK, reset count',
            school: 'Thief',
          },
        ],
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
        burstCommands: [
          {
            instant: true,
            other: 'h80, Regen (hi)',
            school: 'White Magic',
          },
          {
            other: 'party h25',
            school: 'White Magic',
          },
        ],
      });
      expect(describeEnlirSoulBreak(soulBreaks['Alma - Gentle Chant'])).toEqual({
        other: 'ally h45, self +20% MND 25s',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Marche - Nurse'])).toEqual({
        other: 'party heal 40% HP, Esuna, +100% DEF 25s',
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
    });

    it('converts unusual statuses', () => {
      // Discrepancy: MrP sometimes lists this as "crit dmg=2x".
      expect(describeEnlirSoulBreak(soulBreaks['Ayame - Hagakure Yukikaze'])).toEqual({
        damage: 'phys 7.1/10 ice+non',
        other: 'ice infuse 25s, self Retaliate @p1.2 15s, +50% crit dmg 25s',
      });

      // Discrepancy: MrP lists these as "taunt & cancel BLK to refill abils",
      // which is consistent with its refill text, but it seems too verbose.
      //
      // Discrepancy: We only omit "self" for glints, so that we can
      // consistently better communicate abilities like Gladiolus's Survival
      // Spirit.  Is that best?
      expect(describeEnlirSoulBreak(soulBreaks['Celes - Runic Blade'])).toEqual({
        other: 'taunt & absorb BLK 25s',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Celes - Whetted Blade'])).toEqual({
        damage: 'phys 6.9/10 holy+ice+wind+non',
        other:
          'self 1.3x Spellblade dmg 15s, double Spellblade (uses extra hone) 15s, ' +
          'taunt & absorb BLK/WHT 25s',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Gau - Savory Treat'])).toEqual({
        damage: 'phys 6.84/12 wind+lgt+non',
        other: 'self crit =100% 25s, double Combat/Celerity (uses extra hone) 15s',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Emperor - Clever Ruse'])).toEqual({
        instant: true,
        other: '-10% lgt dmg 15s, self hi fastcast 2',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Firion - Rush of Arms'])).toEqual({
        damage: 'phys 7.0/10 holy+fire+ice',
        other:
          'self 1.3x PHY dmg 15s, 15s: EX: Knight/Samurai instacast, heal 10% of Knight/Samurai dmg',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Luneth - Howling Vortex'])).toEqual({
        damage: 'phys 7.1/10 wind+non',
        other: 'wind infuse 25s, self heal 10% of wind dmg 15s, 15s: (wind ⤇ p1.92/6 wi+n Dragoon)',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Fujin - Jin'])).toEqual({
        other: 'AoE 0.75x status chance 15s, party Phys blink 1',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Galuf - Unshaken Resolve'])).toEqual({
        damage: 'phys 7.8/4',
        other: 'self +50% ATK 25s, immune atks/status/heal 30s',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Haurchefant - Live to Serve'])).toEqual({
        other:
          'self Autoheal 6k, +100% DEF/RES, +50% MND 25s, ' +
          '15s: if in front, 100% cover PHY,BLK,WHT,SUM,BLU vs back row, taking 0.5x dmg',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Paine - Rushing Steel'])).toEqual({
        damage: 'phys 7.1/10 water+non',
        other: 'water infuse 25s, self Spellblade fastcast 15s, +30% ATK/DEF 25s',
      });
    });

    it('converts combinations of stat changes, statuses, and infuses', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Agrias - Loyal Blade'])).toEqual({
        damage: 'phys 7.1/10 holy+non',
        other: '-50% ATK/MAG 25s, holy infuse 25s, self 1.15x Knight dmg 25s',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Lilisette - Vivifying Waltz'])).toEqual({
        damage: undefined,
        other: 'AoE -40% A/D/M/R 25s, party Autoheal 2k',
        burstCommands: [
          { damage: 'p1.8 l+wi', fast: true, other: '-50% MAG 15s', school: 'Dancer' },
          { damage: undefined, other: 'party h25 (NAT)', school: 'Dancer' },
        ],
      });

      expect(describeEnlirSoulBreak(soulBreaks['Lilisette - Sensual Dance'])).toEqual({
        damage: undefined,
        other:
          'AoE +20% lgt vuln. 25s, -70% ATK/DEF/MAG 8s, ' +
          '15s: (Celerity/Dancer ⤇ p2.0/5 l+wi+n Dancer)',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Orran - Celestial Stasis'])).toEqual({
        other: 'AoE -70% A/D/M/R 8s, party Magic blink 1, instacast 1',
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

    it('converts non-standard stat mods', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Wol - Overkill'])).toEqual({
        damage: 'phys 7.68/8 rngd',
        other: 'Dispel, -70% DEF/RES 8s',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Zidane - Wall of Light'])).toEqual({
        other: 'party Regen (hi), +25% DEF/RES 25s',
      });
    });

    it('converts cast speed changes', () => {
      const flashingBladeId = 30221031;
      expect(
        describeEnlirSoulBreak(enlir.abilities[flashingBladeId], { includeSchool: false }),
      ).toEqual({
        damage: 'AoE phys 2.66/2 no miss',
        other: 'cast time 1.650/1.485/1.155/0.825/0.495 w/ 0…4 uses',
        school: 'Samurai',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Ward - Massive Anchor'])).toEqual({
        damage: 'AoE phys 4.97/7 earth+wind jump',
        other: 'earth infuse 25s',
        burstCommands: [
          {
            damage: 'AoE p1.3/2 e+wi jump',
            other: 'cast time 1.650/1.485/1.155/0.825/0.495/0.165 w/ 0…5 uses',
            school: 'Dragoon',
          },
          {
            damage: 'AoE p1.3/2 e+wi rngd',
            other: 'self +30% ATK, -30% DEF 20s',
            school: 'Dragoon',
          },
        ],
      });
    });

    it('converts burst toggles', () => {
      const damage = describeEnlirSoulBreak(soulBreaks['Angeal - Unleashed Wrath']);
      expect(damage).toEqual({
        damage: 'phys 6.64/8 holy+wind',
        other: 'party crit =50% 25s',
        burstCommands: [
          {
            other: 'self fastcast 3',
            burstToggle: true,
            school: 'Knight',
          },
          {
            damage: 'p3.42/6 h+wi @ +50% crit dmg',
            burstToggle: false,
            school: 'Knight',
          },
          {
            damage: 'p2.28/4 h+wi',
            school: 'Knight',
          },
          {
            damage: 'p2.85/5 h+wi',
            school: 'Knight',
          },
        ],
      });
      expect(damage.burstCommands!.map(i => formatMrP(i))).toEqual([
        'ON, self fastcast 3',
        'OFF, p3.42/6 h+wi @ +50% crit dmg',
        'p2.28/4 h+wi',
        'p2.85/5 h+wi',
      ]);

      const heal = describeEnlirSoulBreak(soulBreaks['Aphmau - Realignment']);
      expect(heal).toEqual({
        other: 'party h55, +30% MAG/MND 25s',
        burstCommands: [
          {
            burstToggle: true,
            other: 'h60',
            school: 'White Magic',
          },
          {
            burstToggle: false,
            damage: 'w10.48/4 l+n',
            other: 'ally h60',
            school: 'White Magic',
          },
          { other: 'party h25', school: 'White Magic' },
          { damage: 'w10.28/2 l+n', other: 'party h25', school: 'White Magic' },
        ],
      });
      expect(heal.burstCommands!.map(i => formatMrP(i))).toEqual([
        'ON, h60',
        'OFF, w10.48/4 l+n, ally h60',
        'party h25',
        'w10.28/2 l+n, party h25',
      ]);

      // TODO: How to handle Rubicante, with a toggle command that has an effect?
    });

    it('converts Squall-type burst commands', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Balthier - Spark of Change'])).toEqual({
        damage: 'phys 7.68/8 fire+non rngd',
        other: '+20% fire vuln. 25s',
        burstCommands: [
          {
            damage: 'p0.6/2 f+n rngd',
            other: '25% for +10% fire vuln. 15s, powers up cmd 2',
            school: 'Machinist',
          },
          {
            damage: 'p0.96/4 - 2.16/4 - 3.36/4 - 4.8/4 f+n rngd',
            other: undefined,
            school: 'Machinist',
          },
        ],
      });

      expect(describeEnlirSoulBreak(soulBreaks['Squall - Steely Blade'])).toEqual({
        damage: 'phys 6.64/8 ice+non',
        other: 'ice infuse 25s',
        burstCommands: [
          { damage: 'p0.8/2 i+n', other: 'powers up cmd 2', school: 'Spellblade' },
          {
            damage: 'p2.16/4 - 4.45/5 - 6.3/6 - 8.75/7 i+n @ +0 - 5 - 10 - 25% crit',
            school: 'Spellblade',
          },
        ],
      });

      expect(describeEnlirSoulBreak(soulBreaks['Kefka - Harness the Fiend'])).toEqual({
        damage: 'magic 15.04/8 dark+bio',
        other: 'dark infuse 25s',
        burstCommands: [
          {
            damage: 'm4.4/2 d+b',
            other: 'powers up cmd 2, -10%/-20%/-30%/-30% MAG w/ 0-1-2-3 uses 25s',
            school: 'Black Magic',
          },
          {
            damage: 'm6.9/3 - 9.4/4 - 12.0/5 - 18.0/6 d+b',
            other: undefined,
            school: 'Black Magic',
          },
        ],
      });

      expect(describeEnlirSoulBreak(soulBreaks['Thancred - Fang of the Serpent'])).toEqual({
        instant: true,
        damage: 'phys 6.4/8 bio+non',
        other: 'party Phys blink 1',
        burstCommands: [
          { fast: true, damage: 'p1.0/2 b+n', other: 'powers up cmd 2', school: 'Ninja' },
          {
            fast: true,
            damage: 'p1.8/4 - 2.9/5 - 4.32/6 - 6.16/7 - 8.8/8 b+n @ +0 - 5 - 10 - 15 - 25% crit',
            other: 'reset count',
            school: 'Ninja',
          },
        ],
      });
    });

    it('handles stacking burst commands', () => {
      // Discrepancy: MrP lists this as 'p0.52/1 h+n rng, stack to p4.16/8 for 25s'
      // We'll instead try listing it out, at least for now, since that's what
      // Enlir does.
      expect(describeEnlirSoulBreak(soulBreaks['Firion - Weaponsmaster'])).toEqual({
        instant: true,
        damage: 'AoE phys 5.84/4 holy+non rngd',
        other: 'party Magic blink 1',
        burstCommands: [
          {
            damage:
              'p0.52 - 1.04/2 - 1.56/3 - 2.08/4 - 2.6/5 - 3.12/6 - 3.64/7 - 4.16/8 h+n rngd w/ 0…7 uses',
            other: undefined,
            school: 'Combat',
          },
          { damage: 'p1.68/4 h+n', other: 'self instacast 1 turn', school: 'Combat' },
        ],
      });
    });

    it('handles complex burst modes', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Ignis - Stalwart Cook'])).toEqual({
        burstCommands: [
          { damage: 'p1.92/3 f+l+i', other: '+1 ingredients', school: 'Thief' },
          { other: 'crit =100% 25s, -1 ingredients', school: 'Support' },
          { other: 'heal 30% HP, +50% crit dmg 25s, -1 ingredients', school: 'Support' },
          { other: 'heal 40% HP, instacast 1, -1 ingredients', school: 'Support' },
        ],
        damage: undefined,
        other: 'party Haste, +30% ATK/RES 25s, +2 ingredients',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Josef - Undaunted Hero'])).toEqual({
        burstCommands: [
          { damage: 'p1.41/3 i+n, or p2.82/6 in cmd2 status', school: 'Monk' },
          { damage: 'p1.88/4 i+n', other: '25s: -40% DEF/RES, fastcast', school: 'Monk' },
        ],
        damage: undefined,
        other: 'ice infuse 25s, party +30% ATK/MAG 25s',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Yda - Forbidden Chakra'])).toEqual({
        damage: 'phys 7.36/8 fire+non',
        other: '-40% A/D/M/R 25s',
        burstCommands: [
          {
            damage: 'p2.32/4 f+n',
            other: 'self stacking +15%/30%/50% ATK, 1.33x/2.0x/4.0x cast until damaged',
            school: 'Monk',
          },
          { damage: undefined, other: 'self Negate dmg 30%', school: 'Monk' },
        ],
      });
    });

    it('handles stacking statuses', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Ursula - Assert Dominance'])).toEqual({
        instant: true,
        other: 'self hi fastcast 2, 15s: stacking crit =50%/=75%/=100%',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Refia - Bridled Love'])).toEqual({
        instant: true,
        other:
          'self hi fastcast 2, 15s: stacking (fire ⤇ p1.6/4 - 2.0/5 - 2.4/6 f+n Monk @ 1-2-3 stacks)',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Tifa - Zangan Awakening'])).toEqual({
        instant: true,
        other:
          'self 1.05-1.1-1.15-1.2-1.3x Monk dmg @ rank 1-5 15s, 15s: stacking 2.0x/4.0x/6.0x cast',
      });
    });

    it('processes crit modifiers', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Umaro - Snowball Throwdown'])).toEqual({
        damage: 'phys 6.8/10 ice+non rngd',
        other:
          'ice infuse 25s, self +30% ATK/RES 25s, ' +
          '15s: (ice ⤇ p2.0/5 i+n rngd Sharpshooter @ +50% crit if Mog alive)',
      });

      // Discrepancy: MrP often uses ' (+50% crit dmg)'
      expect(describeEnlirSoulBreak(soulBreaks['Delita - Hero-King'])).toEqual({
        damage: 'phys 6.96/8 holy+fire+lgt+ice @ +50% crit dmg',
        other: undefined,
        burstCommands: [
          { damage: 'p2.32/4 h+f @ +50% crit dmg', other: undefined, school: 'Spellblade' },
          { damage: 'p2.32/4 l+i @ +50% crit dmg', other: undefined, school: 'Spellblade' },
        ],
      });

      const warringFlameId = 30221101;
      expect(
        describeEnlirSoulBreak(enlir.abilities[warringFlameId], { includeSchool: false }),
      ).toEqual({
        damage: 'phys 3.0/4 fire @ +50% crit if Retaliate',
        school: 'Samurai',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Eight - Phantom Hail'])).toEqual({
        instant: true,
        damage: 'phys 5.2/8 ice+non',
        other: '+20% ice vuln. 25s',
        burstCommands: [
          {
            damage: 'p2.16/4 i+n @ +100% crit if Phys blink',
            school: 'Monk',
          },
          { fast: true, damage: 'p1.5/2 i+n', other: 'self Phys blink 1', school: 'Monk' },
        ],
      });

      expect(describeEnlirSoulBreak(soulBreaks['Fang - Whim of Ragnarok'])).toEqual({
        damage: 'phys 7.1/10 wind+non jump',
        other:
          'wind infuse 25s, self no air time 15s, ' +
          '15s: (Dragoon ⤇ p2.0/5 wi+n rngd Dragoon @ +30 - 50 - 75% crit w/ 0-1-2 uses)',
      });
    });

    it('converts EX modes with unusual bonuses', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Cloud - Ultra Cross Slash'])).toEqual({
        damage: 'phys 7.5/5 wind+dark',
        other: 'self crit =100% 25s, 15s: EX: 1.3x phys dmg, break PHY dmg cap',
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

    it('converts specialized thresholds', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Celes - Blade Unbound'])).toEqual({
        damage:
          'phys 11.0 - 12.0 - 13.0 - 14.0 holy+wind overstrike ' +
          '@ 5-12-20 WHT/BLK/BLU/SUM hits taken',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Edgar - Armageddon Blast'])).toEqual({
        damage: 'AoE phys 8.6 - 9.6 - 10.6 - 11.6 bio+non rngd overstrike @ 0-1-2-3 statuses',
        other: '15% Petrify, Poison, Blind, Silence',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Firion - Rose of Rebellion'])).toEqual({
        damage: 'phys 11.25 - 12.5 - 13.75 holy+non overstrike @ 9-22 atks',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Prishe - Nullifying Dropkick'])).toEqual({
        damage: 'phys 7.44/8',
        other: 'self Monk fastcast 5',
        burstCommands: [
          {
            damage: 'p2.4/3 - 3.2/4 - 4.0/5 - 4.8/6 @ 1-2-3 diff. Monk abils.',
            other: 'reset count',
            school: 'Monk',
          },
          { damage: 'p2.2/4', other: 'self +30% ATK, -30% DEF', school: 'Monk' },
        ],
      });

      // Ninja statuses require extra handling.
      expect(describeEnlirSoulBreak(soulBreaks['Edge - Chaotic Moon'])).toEqual({
        damage: 'phys 7.1/10 water+lgt',
        other:
          '15s: (water ⤇ hi fastcast 1), ' +
          '(Ninja ⤇ p2.16 - 4.32/2 wa+l+n Ninja @ 1-2 Phys blink)',
      });

      // This also tests the interrupt / stun status.
      expect(describeEnlirSoulBreak(soulBreaks['Faris - Phantom'])).toEqual({
        damage: 'AoE phys 7.74/6 - 6.69/6 - 6.0/6… vs 1-2-3… foes',
        other: '100% Stun, -30% A/D/M/R/MND 25s',
      });
    });

    it('handles stoneskin, dual-cast, double-cast', () => {
      // Discrepancy: MrP formats this more like 'EX: until Neg. Dmg. lost:'
      // TODO: And I think I might like that better...
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
          'Finisher: magic 11.8 - 20.5 - 34.6 dark+non overstrike Darkness @ 5-9 Darkness used',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Maria - Magma XXXII'])).toEqual({
        damage: 'magic 17.0/10 earth+non',
        other: 'earth infuse 25s, self double B.Mag (uses extra hone) 15s, +30% DEF/MAG 25s',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Noctis - Armiger'])).toEqual({
        damage: 'phys 15.0 overstrike',
        other: 'self Negate dmg 30%, until Neg. Dmg. lost: +30% ATK, hi fastcast',
      });
    });

    it('handles non-elemental damage', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Noctis - Armiger Wakes'])).toEqual({
        damage: 'phys 7.4/10',
        other: 'self Negate dmg 100%, until Neg. Dmg. lost: EX: +30% ATK, 1.1x non-elem dmg',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Noctis - Airstride'])).toEqual({
        damage: 'phys 7.4/10',
        other:
          'self 1.5x non-elem dmg 15s, ' +
          '15s: EX: +30% ATK, fastcast, (Combat/Celerity ⤇ p2.0/5 Combat)',
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

      expect(describeEnlirSoulBreak(soulBreaks['Wedge - Great Chain-Cast'])).toEqual({
        damage: 'magic 16.5/10 fire+wind+ice+non',
        other: 'self 1.5x B.Mag dmg 2 turns, instazap 2, 15s: (B.Mag ⤇ m7.68/6 f+wi+i+n B.Mag)',
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
          '15s: (1/2/3 B.Mag ⤇ m4.08/2 f+n B.Mag, self hi fastcast 2 ' +
          '– m4.08/2 f+n B.Mag, party heal 1.5k ' +
          '– m16.32/8 f+n B.Mag)',
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
          'self 1.05-1.1-1.15-1.2-1.3x Machinist dmg @ rank 1-5 15s, ' +
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
      expect(describeEnlirSoulBreak(soulBreaks['Relm - Friend Sketch'])).toEqual({
        instant: true,
        other:
          'party h85, Last stand, 15s: (every 3.5s ⤇ w9.0/6 wa+n/wa+n/wa+d+n/wa+d+f+n W.Mag, party h25, 0̸/0̸/0̸/Regen (hi) if 0/1/2/3+ VI chars.)',
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
          '15s: Finisher: magic 11.8 - 20.5 - 34.6 holy+non overstrike Summon @ 3-6 holy used, ' +
          'refill 0/1/2 abil. use, ' +
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

    it('converts stacking EX bonuses', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Firion - Double Trouble'])).toEqual({
        damage: 'phys 7.1/10 holy+non',
        other:
          'holy infuse 25s, 15s: EX: +30% ATK, ' +
          'cast speed 2.0x, +0.5x per atk, max 6.5x @ 9 atks',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Onion Knight - Forbidden Power'])).toEqual({
        other:
          'party Haste, crit =50%, +50% ATK 25s, ' +
          '15s: EX: +30% ATK, cast speed 1.3x, +0.3x per atk, max 3.4x @ 7 atks',
      });
    });

    it('converts follow-ups that combine statuses and skills', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Setzer - Jokers Wild'])).toEqual({
        damage: 'phys 7.1/10 rngd',
        other:
          '-30% A/D/M/R/MND 25s, 15s: (Support dmg ⤇ hi fastcast 1, p0.5/2 rngd Support, ' +
          '-40% ATK/-50% DEF/-40% MAG/-50% RES 15s (random))',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Ramza - Seeker of Truth'])).toEqual({
        damage: 'phys 7.1/10 holy+non',
        other:
          'holy infuse 25s, self hi fastcast 1, ' +
          '15s: (holy ⤇ hi fastcast 1, p1.56/4 h+n Support)',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Bartz - Essence of Wind'])).toEqual({
        damage: 'phys 7.1/10 wind+non',
        other:
          'wind infuse 25s, 15s: EX: (1/2/3 +3n Wind ⤇ front row phys hi fastcast 1, ' +
          'p0.3 – p1.5/5 – p4.5/15 wi+n Spellblade)',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Ricard - Winged Roar'])).toEqual({
        damage: 'phys 7.1/10 wind+lgt jump',
        other:
          'self jump instacast 15s, ' +
          '15s: (Dragoon ⤇ same row 1.3x Dragoon dmg 1 turn, no air time 1 turn)',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Jecht - Beast and Father'])).toEqual({
        damage: 'phys 7.0/10 dark+fire+non',
        other: 'dark infuse 25s, (dark ⤇ same row fastcast 1, p1.92/6 d+f+n Darkness)',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Lightning - Warrior Goddess'])).toEqual({
        damage: 'phys 7.1/10 holy+lgt',
        other:
          'holy infuse 25s, 15s: EX: (1/2/3 +3n Holy ⤇ front row phys hi fastcast 1, ' +
          'p0.3 – p1.5/5 – p4.5/15 h+l+n Knight)',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Steiner - Reckless Steiner'])).toEqual({
        damage: 'phys 6.9/10 fire+lgt+ice+non',
        other:
          'party instacast 1, 15s: (hit weak ⤇ +10% fire/lgt/ice dmg, p1.86/6 f+l+i+n Spellblade)',
      });
    });

    it('converts heals', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Porom - Twin Full Cure'])).toEqual({
        instant: true,
        other:
          'party h85, hi fastzap 2, Last stand, ' +
          '15s: (2 W.Mag ⤇ party h25, h27 if Palom alive)',
      });

      // Discrepancy: MrP doesn't consistently identify NAT healing, but it
      // seems like it's worth doing.
      expect(describeEnlirSoulBreak(soulBreaks['Aphmau - Overdrive (XI)'])).toEqual({
        instant: true,
        other: 'party h85 (NAT), Haste, instacast 1',
      });
    });

    it('converts percent heals', () => {
      // Deviation: MrP sometimes says "40%" or "40% HP" or "40% max HP"
      expect(describeEnlirSoulBreak(soulBreaks['Prishe - Rigorous Reverie'])).toEqual({
        other: 'party heal 40% HP, Regen (hi), Last stand',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Gladiolus - Survival Spirit'])).toEqual({
        other: 'self heal 25% HP',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Garnet - Trial by Lightning'])).toEqual({
        damage: undefined,
        other: 'AoE +20% lgt vuln. 25s, party +30% ATK/MAG 25s',
        burstCommands: [
          {
            burstToggle: true,
            damage: undefined,
            other: 'heal 40% HP',
            school: 'Summoning',
          },
          {
            burstToggle: false,
            damage: 'AoE m5.4/2 l+n',
            other: 'party heal 30% HP',
            school: 'Summoning',
          },
          { damage: 'm10.48/4 l+n, min dmg 1100', other: undefined, school: 'Summoning' },
          { damage: 'm13.1/5 l+n, min dmg 1100', other: undefined, school: 'Summoning' },
        ],
      });
    });

    it('converts fixed heals', () => {
      const healingSmiteId = 30211161;
      expect(
        describeEnlirSoulBreak(enlir.abilities[healingSmiteId], { includeSchool: false }),
      ).toEqual({
        damage: 'phys 4.0/5 holy',
        other: 'ally heal 2k',
        school: 'Knight',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Cecil (Paladin) - Paladin Wall'])).toEqual({
        other: 'party +200% DEF/RES 25s, 15s: EX: +30% ATK/DEF, (Knight ⤇ front row heal 1.5k HP)',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Curilla - Extreme Defense'])).toEqual({
        other: 'party Protect, Shell, Last stand, 15s: (Knight ⤇ front row heal 1.5k HP)',
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
        burstCommands: [
          {
            damage: 'm8.68/4 d+n',
            other: '31% (9% × 4) KO',
            school: 'Black Magic',
          },
          {
            damage: 'AoE m6.08/2 d+n',
            other: '29% (16% × 2) Slow',
            school: 'Black Magic',
          },
        ],
      });
      // 'Mustadio - Seal Evil (FFT)' below has some additional checks.
    });

    it('handles Dispel and Esuna', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Shelke - Countertek'])).toEqual({
        other: 'AoE Dispel, party Esuna, Regen (hi)',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Larsa - Righteous Prince'])).toEqual({
        instant: true,
        other: 'party Esuna, Status blink 1',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Ceodore - Holy Cross'])).toEqual({
        burstCommands: [
          {
            damage: 'p2.2/4 h+n',
            other: 'ally heal 25% HP',
            school: 'Knight',
          },
          {
            damage: 'AoE p1.58/2 h+n',
            other: 'ally Esuna',
            school: 'Knight',
          },
        ],
        damage: 'phys 7.52/8 holy+non',
        other: 'party heal 40% HP',
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
        burstCommands: [
          {
            damage: 'p2.52/4 wa+wi',
            school: 'Spellblade',
          },
          {
            damage: 'p2.52/4 wa+e',
            school: 'Spellblade',
          },
        ],
      });
      expect(describeEnlirSoulBreak(soulBreaks['Jecht - Blitz King'])).toEqual({
        damage: 'phys 11.7 dark+fire rngd overstrike, up to p13.0 @ 6 SB bars',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Cid Raines - Shattered Dreams'])).toEqual({
        damage: 'magic 37.39 dark+holy overstrike, up to m48.0 at low Doom time, default m37.0',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Gladiolus - Dawnhammer'])).toEqual({
        damage: 'phys 11.44 earth+non overstrike, up to p12.93 w/ hits taken',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Lightning - Thunderfall'])).toEqual({
        damage: 'phys 11.25 - 12.0 - 12.75 - 13.5 lgt+non overstrike w/ 0-1-2-3 uses',
        other: undefined,
      });
    });

    it('converts conditional attacks', () => {
      // Deviation: MrP sometimes uses parentheses and sometimes ", or "
      expect(describeEnlirSoulBreak(soulBreaks['Ace - Firaga SHG'])).toEqual({
        damage: 'magic 14.0/8 fire+non, or m16.16/8 if in front row',
        other: 'party +30% ATK/MAG 25s',
        burstCommands: [
          {
            damage: 'm8.96/4 f+n',
            other: 'self B.Mag fastcast 2',
            school: 'Black Magic',
          },
          {
            damage: 'AoE m7.8/2 f+n',
            other: 'self +30% MAG, -30% DEF 20s',
            school: 'Black Magic',
          },
        ],
      });
      expect(describeEnlirSoulBreak(soulBreaks['Ace - Firaga RF'])).toEqual({
        instant: true,
        damage: 'magic 15.04/8 fire+non',
        other: 'party Phys blink 1',
        burstCommands: [
          {
            fast: true,
            damage: 'm7.84/4 f+n, or m9.8/5 if in front row',
            school: 'Black Magic',
          },
          {
            damage: 'AoE m7.8/2 f+n',
            other: 'self +30% MAG, -30% RES 20s',
            school: 'Black Magic',
          },
        ],
      });
      expect(describeEnlirSoulBreak(soulBreaks['Zidane - Meo Twister'])).toEqual({
        damage: 'phys 11.8 wind+non overstrike, or p12.8 if 4 females in party',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Steiner - Imbued Blade'])).toEqual({
        damage: 'phys 10.5 fire+lgt+ice overstrike, or p13.0 vs. weak',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Matoya - Inner Eye'])).toEqual({
        damage: 'magic 16.0/8 fire+ice+lgt, or m20.0/10 vs. weak',
        burstCommands: [
          {
            damage: 'm10.48/4 f+i',
            school: 'Black Magic',
          },
          {
            damage: 'm10.48/4 f+l',
            school: 'Black Magic',
          },
        ],
      });
      expect(describeEnlirSoulBreak(soulBreaks['Beatrix - Knight Protector'])).toEqual({
        damage: 'AoE phys 5.48/4 holy, or p6.12/4 if no allies KO',
        other: '+20% holy vuln. 25s',
        burstCommands: [
          {
            damage: 'p2.5/2 h',
            other: 'taunt PHY/BLK, +200% DEF 25s',
            school: 'Knight',
          },
          {
            damage: 'p2.7/2',
            other: 'self +40% RES 20s',
            school: 'Knight',
          },
        ],
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
      expect(describeEnlirSoulBreak(soulBreaks['Balthier - Gatling Gun'])).toEqual({
        damage: 'phys 7.5/10 fire rngd',
        other: '97% (30% × 10) Blind',
        burstCommands: [
          {
            damage: 'p2.3/2 rngd, or p2.8/2 vs. Blind',
            other: '84% (60% × 2) Blind',
            school: 'Machinist',
          },
          { damage: 'p2.44/4 f+n rngd', school: 'Machinist' },
        ],
      });
    });

    it('converts status ailments', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Maria - Meteor XVI'])).toEqual({
        damage: 'magic 15.04/8 earth+non',
        other: 'earth infuse 25s',
        burstCommands: [
          {
            damage: 'm6.0/3 - 8.0/4 - 10.0/5 - 12.0/6 e+n @ 624-973-1032 MAG',
            other: '5%/hit Petrify',
            school: 'Black Magic',
          },
          {
            damage: 'AoE m6.18/2 e+f',
            other: 'self +30% MAG, -30% DEF 20s',
            school: 'Black Magic',
          },
        ],
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
          'wind infuse 25s, 15s: EX: 1.05-1.1-1.15-1.2-1.3x SUM dmg @ rank 1-5, ' +
          'Finisher: AoE magic 35% SUM/5 Summon, self refill 2 abil. use',
      });
    });

    it('converts brave soul breaks', () => {
      const attack = describeEnlirSoulBreak(soulBreaks['Firion - Fervid Blazer']);
      expect(attack).toEqual({
        damage: 'phys 7.0/10 holy+ice+fire',
        other: 'self crit =75% 15s, fastcast 15s',
        braveCommands: [
          {
            damage: 'p1.9 h+i+f',
            school: 'Samurai',
          },
          {
            damage: 'p3.15 h+i+f overstrike',
            school: 'Samurai',
          },
          {
            damage: 'p6.3 h+i+f overstrike',
            school: 'Samurai',
          },
          {
            damage: 'p9.85 h+i+f overstrike',
            school: 'Samurai',
          },
        ],
      });
      expect(formatBraveCommands(attack.braveCommands!)).toEqual(
        'p1.9 – 3.15 – 6.3 – 9.85 h+i+f, overstrike at brv.1+',
      );

      const summon = describeEnlirSoulBreak(soulBreaks['Alphinaud - Garuda Exoburst']);
      expect(summon).toEqual({
        damage: 'magic 17.3/10 wind (SUM)',
        other: 'party Reflect Dmg 75% as wind 30s, self hi fastcast 2',
        braveCommands: [
          {
            damage: 'm7.92 wi',
            school: 'Summoning',
          },
          {
            damage: 'm11.64/3 wi',
            school: 'Summoning',
          },
          {
            damage: 'm19.32/6 wi',
            other: 'self refill 1 Summon abil. use',
            school: 'Summoning',
          },
          {
            damage: 'm29.64/12 wi',
            other: 'self refill 1 Summon abil. use',
            school: 'Summoning',
          },
        ],
      });
      expect(formatBraveCommands(summon.braveCommands!)).toEqual(
        'm7.92 – 11.64/3 – 19.32/6 – 29.64/12 wi, self refill 1 Summon abil. use at brv.2+',
      );

      const healer = describeEnlirSoulBreak(soulBreaks['Arc - Heavenly Rains']);
      expect(healer).toEqual({
        instant: true,
        other: 'party h85, +100% RES 25s',
        braveCommands: [
          {
            instant: true,
            other: 'h25',
            school: 'White Magic',
          },
          {
            instant: true,
            other: 'party h25',
            school: 'White Magic',
          },
          {
            instant: true,
            other: 'party h55',
            school: 'White Magic',
          },
          {
            instant: true,
            other: 'party h55, Last stand',
            school: 'White Magic',
          },
        ],
      });
      expect(formatBraveCommands(healer.braveCommands!)).toEqual(
        'instant h25 – party h25 – party h55 – party h55, Last stand at brv.3',
      );

      const paladin = describeEnlirSoulBreak(soulBreaks['Cecil (Paladin) - Crystal Vanguard']);
      expect(paladin).toEqual({
        damage: 'phys 7.2/10 holy',
        other: 'party Last stand, self 1.3x Knight dmg 15s',
        braveCommands: [
          {
            damage: 'p1.92 h',
            school: 'Knight',
          },
          {
            damage: 'p2.4/3 h',
            other: 'party Autoheal 1k',
            school: 'Knight',
          },
          {
            damage: 'p4.5/5 h',
            other: 'party Autoheal 2k',
            school: 'Knight',
          },
          {
            damage: 'p7.0/7 h',
            other: 'party Autoheal 4k',
            school: 'Knight',
          },
        ],
      });
      expect(formatBraveCommands(paladin.braveCommands!)).toEqual(
        'p1.92 – 2.4/3 – 4.5/5 – 7.0/7 h, party Autoheal 1k – 2k – 4k at brv.1+',
      );

      const breaks = describeEnlirSoulBreak(soulBreaks['Faris - Essence of Flame']);
      expect(breaks).toEqual({
        instant: true,
        damage: 'phys 6.0/10 fire+wind rngd',
        other: '-40% ATK/DEF 25s, self 1.3x Thief dmg 15s',
        braveCommands: [
          {
            instant: true,
            damage: 'p1.5 f+wi rngd',
            school: 'Thief',
          },
          {
            instant: true,
            damage: 'p2.34/6 f+wi rngd',
            other: '-30% DEF 15s',
            school: 'Thief',
          },
          {
            instant: true,
            damage: 'p4.68/6 f+wi rngd',
            other: '-40% DEF 15s',
            school: 'Thief',
          },
          {
            instant: true,
            damage: 'p7.26/6 f+wi rngd',
            other: '-70% DEF/RES/MND 8s',
            school: 'Thief',
          },
        ],
      });
      expect(formatBraveCommands(breaks.braveCommands!)).toEqual(
        'instant p1.5 – 2.34/6 – 4.68/6 – 7.26/6 f+wi rngd, -30% DEF 15s – -40% DEF 15s – -70% DEF/RES/MND 8s at brv.1+',
      );

      const darkKnight = describeEnlirSoulBreak(soulBreaks['Leon - Darkness Weapon']);
      expect(darkKnight).toEqual({
        damage: 'phys 7.2/10 dark',
        other: '-40% ATK/MAG 25s, self fastcast 15s',
        braveCommands: [
          {
            damage: 'p1.92 d',
            school: 'Darkness',
          },
          {
            damage: 'p3.85 d overstrike',
            other: '-30% DEF 15s, self lose 25% max HP',
            school: 'Darkness',
          },
          {
            damage: 'p7.7 d overstrike',
            other: '-30% DEF 15s, self lose 25% max HP',
            school: 'Darkness',
          },
          {
            damage: 'p12.0 d overstrike',
            other: '-70% DEF/RES 8s, self lose 25% max HP',
            school: 'Darkness',
          },
        ],
      });
      expect(formatBraveCommands(darkKnight.braveCommands!)).toEqual(
        'p1.92 – 3.85 – 7.7 – 12.0 d, overstrike at brv.1+, ' +
          '-30% DEF 15s – -30% DEF 15s – -70% DEF/RES 8s & self lose 25% max HP at brv.1+',
      );

      const hybrid = describeEnlirSoulBreak(soulBreaks['Reno - Pyramid Pinnacle']);
      expect(hybrid).toEqual({
        damage: 'p7.2/10 or m17.3/10 lgt rngd',
        other: 'lgt infuse 25s, self 1.3x B.Mag/Machinist dmg 15s',
        braveCommands: [
          {
            damage: 'p1.92 or m7.92 l rngd',
            school: 'Special',
          },
          {
            damage: 'p3.25 or m12.0 l rngd overstrike',
            school: 'Special',
          },
          {
            damage: 'p6.5 or m20.8 l rngd overstrike',
            school: 'Special',
          },
          {
            damage: 'p10.15 or m35.0 l rngd overstrike',
            school: 'Special',
          },
        ],
      });
      expect(formatBraveCommands(hybrid.braveCommands!)).toEqual(
        'p1.92 – 3.25 – 6.5 – 10.15 or m7.92 – 12.0 – 20.8 – 35.0 l rngd, overstrike at brv.1+',
      );

      const finalEffect = describeEnlirSoulBreak(soulBreaks['Kuja - Chaos Rhapsody']);
      expect(finalEffect).toEqual({
        damage: 'magic 17.3/10 dark',
        other: 'dark infuse 25s, party Doom 30s, self +30% MAG/RES 25s',
        braveCommands: [
          {
            damage: 'm7.92 d',
            school: 'Darkness',
          },
          {
            damage: 'm12.0 d overstrike',
            school: 'Darkness',
          },
          {
            damage: 'm20.8 d overstrike',
            school: 'Darkness',
          },
          {
            damage: 'm35.0 d overstrike',
            other: 'self Reraise 40%',
            school: 'Darkness',
          },
        ],
      });
      expect(formatBraveCommands(finalEffect.braveCommands!)).toEqual(
        'm7.92 – 12.0 – 20.8 – 35.0 d, overstrike at brv.1+, self Reraise 40% at brv.3',
      );

      const mimic = describeEnlirSoulBreak(soulBreaks['Gogo (VI) - Righteous Mimicry']);
      expect(mimic).toEqual({
        braveCommands: [
          { fast: true, damage: 'p1.81 or m7.45', school: 'Special' },
          { fast: true, other: 'Mimic 1x', school: 'Special' },
          { fast: true, other: 'Mimic 2x', school: 'Special' },
          { fast: true, other: 'Mimic 3x', school: 'Special' },
        ],
        damage: undefined,
        instant: true,
        other: 'party Haste',
      });
      expect(formatBraveCommands(mimic.braveCommands!)).toEqual(
        'p1.81 or m7.45 at brv.0, Mimic 1x – 2x – 3x at brv.1+',
      );
    });

    it('converts AASBs', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Agrias - Holy Cross Blade'])).toEqual({
        damage: 'phys 9.0/15 holy+non',
        other:
          'holy infuse 25s, self dmg cap=19,999 15s, 15s: (2 Knight ⤇ +10% holy vuln. 15s), ' +
          '15s: Awoken Knight: Knight inf. hones, up to 1.3x dmg @ rank 5, 100% dualcast',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Noctis - Kingly Duties'])).toEqual({
        damage: 'phys 9.0/15 fire+earth+lgt+non',
        other:
          'self crit =100% 25s, dmg cap=19,999 15s, ' +
          '15s: hi fastcast, ' +
          'Finisher: phys 3.1 - 6.2 - 9.7 fire+earth+lgt+non overstrike Combat @ 0-7-11 fire/earth/lgt used, ' +
          '15s: Awoken Lucis King: fire/earth/lgt inf. hones, up to 1.3x dmg @ rank 5, 100% dualcast',
      });

      // This also helps test the interaction of status effects and stat mods,
      // because of the "causes DEF, RES and MND -70% for 8 seconds" follow-up.
      expect(describeEnlirSoulBreak(soulBreaks['Auron - Living Flame'])).toEqual({
        damage: 'phys 9.0/15 fire+non',
        other:
          'fire infuse 25s, self dmg cap=19,999 15s, ' +
          '15s: (3 Samurai ⤇ p5.28 f+n overstrike Samurai, -70% DEF/RES/MND 8s), ' +
          '15s: Awoken Samurai: Samurai inf. hones, up to 1.3x dmg @ rank 5, 100% dualcast',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Cecil (Paladin) - Radiant Moon'])).toEqual({
        damage: 'p9.0/15 or w24.0/15 holy+non',
        other:
          'holy infuse 25s, party 75% Dmg barrier 3, ' +
          'self dmg cap=19,999 15s, 15s: Awoken Holy: holy inf. hones, up to 1.3x dmg @ rank 5, 100% dualcast',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Cloud - Heavensent'])).toEqual({
        damage: 'phys 9.0/15 wind+non',
        other:
          'wind infuse 25s, self dmg cap=19,999 15s, crit =100% 25s, hi fastcast 15s, ' +
          '15s: (3 wind (once only) ⤇ instacast 1, +250 SB pts), ' +
          '15s: Awoken Wind: wind inf. hones, up to 1.3x dmg @ rank 5, 100% dualcast',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Kain - Lance of Dragon'])).toEqual({
        damage: 'phys 9.0/15 lgt+non jump',
        other:
          'lgt infuse 25s, self dmg cap=29,999 15s, ' +
          '15s: (3 Dragoon ⤇ p5.2 l+wi+n rngd overstrike Dragoon), ' +
          '15s: Awoken Dragoon: Dragoon inf. hones, up to 1.3x dmg @ rank 5, jump instacast',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Zidane - Reverse Gaia'])).toEqual({
        damage: 'phys 9.0/15 wind+non',
        other:
          'wind infuse 25s, self dmg cap=19,999 15s, 1.25x SB gauge from Thief 15s, ' +
          '15s: Awoken Thief: Thief inf. hones, up to 1.3x dmg @ rank 5, 100% dualcast',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Cecil (Dark Knight) - Dark Moon'])).toEqual({
        damage: 'phys 9.0/15 dark+non',
        other:
          'dmg cap=19,999 15s, dark infuse 25s, ' +
          '15s: (2 Darkness ⤇ p4.16/8 - 4.32/8 - 4.48/8 d+n Darkness @ +0 - 30 - 75% crit @ 2-4-6 Darkness used, self lose 25% max HP), ' +
          '15s: Awoken Darkness: Darkness inf. hones, up to 1.3x dmg @ rank 5, 100% dualcast',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Celes - Spinning Twice'])).toEqual({
        damage: 'phys 9.0/15 ice+holy+non',
        other:
          'party Magic blink 1, self +30% ice dmg 15s, +30% holy dmg 15s, dmg cap=19,999 15s, ' +
          '15s: (2 ice/holy ⤇ p2.6/5 i+h+n Spellblade @ 1-2 Magic blink, self Magic blink 2), ' +
          '15s: Awoken Indomitable: holy/ice inf. hones, up to 1.3x dmg @ rank 5, 100% dualcast',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Sephiroth - Stigma'])).toEqual({
        damage: 'phys 9.0/15 dark+non',
        other:
          'dark infuse 25s, self dmg cap=19,999 15s, +500 SB pts, ' +
          '15s: Awoken Darkness: Darkness inf. hones, up to 1.3x dmg @ rank 5, 100% dualcast',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Lenna - Protector of Life and Soul'])).toEqual({
        instant: true,
        other:
          'party h105, Haste, PM blink 1, Last stand, revive @ 100% HP, ' +
          '15s: Awoken Devotion: W.Mag inf. hones, W.Mag hi fastcast, ' +
          '(W.Mag ⤇ party h10/15/25/35/45 @ rank 1-5)',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Selphie - Selphie Band'])).toEqual({
        instant: true,
        other:
          'party h105, Haste, Magic blink 2, revive @ 100% HP, ' +
          '15s: Awoken Dancer: Dancer inf. hones, Dancer hi fastcast, ' +
          '(Dancer ⤇ party 10%/15%/20%/30%/40% Dmg barrier 1 @ rank 1-5)',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Queen - Savage Judgment'])).toEqual({
        damage: 'phys 9.0/15 lgt+dark+non',
        other:
          'lgt infuse 25s, self dmg cap=19,999 15s, 15s: fastcast, ' +
          '15s: (lgt ⤇ crit =30-50-70-100%), ' +
          '15s: Awoken Lightning: lgt inf. hones, up to 1.3x dmg @ rank 5, 100% dualcast',
      });
      // TODO: Decide about Awoken modes whose statuses duplicate trances, etc.
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
      expect(describeEnlirSoulBreak(soulBreaks['Bartz - Call of the Wind'])).toEqual({
        damage: 'phys 6.64/8 wind+non',
        other: 'wind infuse 25s',
        burstCommands: [
          { damage: 'p2.16/4 wi+n', other: undefined, school: 'Spellblade' },
          {
            damage: 'p1.68/3 wi+n',
            other: 'self 1.15x Spellblade dmg 3 turns',
            school: 'Spellblade',
          },
        ],
      });
    });

    it('handles ether abilities', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Red XIII - Howling Moon'])).toEqual({
        other: 'party refill 1 random abil. use',
      });
      expect(describeEnlirSoulBreak(soulBreaks["Enna - Grymoire's Protection"])).toEqual({
        other: 'self refill 1 abil. use',
      });
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

    it('handles Doom', () => {
      // See also Doom under scaling attacks.
      expect(describeEnlirSoulBreak(soulBreaks['Kuja - Final Requiem'])).toEqual({
        damage: 'magic 38.0 dark+non overstrike, or m44.0 if Doomed',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Cid Raines - True Miracle'])).toEqual({
        damage: 'magic 16.2/10 dark+holy, or m18.7/10 if Doomed',
        other: 'self +30% MAG/RES, Doom 30s, instacast 1, 15s: (holy/dark ⤇ m8.64/4 h+d B.Mag)',
      });
    });

    it('handles NAT abilities', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Hope - Brutal Sanction'])).toEqual({
        damage: 'magic 10.5/3 (NAT)',
        other: '88% (50% × 3) Stop',
      });
    });

    it('handles Soul Break points', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Ramza - Unsung Hero'])).toEqual({
        damage: 'AoE phys 5.85/5 holy',
        other: 'party +100% DEF 25s',
        burstCommands: [
          { damage: 'p2.5/2 h', other: 'Dispel', school: 'Knight' },
          { damage: undefined, other: 'ally +80 SB pts', school: 'Support' },
        ],
      });

      expect(describeEnlirSoulBreak(soulBreaks['Ramza - Battle Cry (FFT)'])).toEqual({
        damage: undefined,
        other: 'holy infuse 25s, party Haste, +50% ATK 25s',
        burstCommands: [
          { damage: 'p2.7/5 h+n', other: 'no SB pts', school: 'Support' },
          { damage: undefined, other: '+180 SB pts', school: 'Support' },
        ],
      });
    });

    it('handles dragoon-related abilities', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Cid (VII) - Big Brawl'])).toEqual({
        damage: 'phys 7.8/12 wind',
        other: 'self no air time 3 turns',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Cid (VII) - Dynamite Boost'])).toEqual({
        damage: 'phys 7.1/10 wind+non jump',
        other: 'wind infuse 25s, self jump instacast 15s, +30% ATK/DEF 25s',
      });
    });

    it('handles Heavy Combat-related abilities', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Cloud - Darkpetal Bloom'])).toEqual({
        damage: 'phys 7.1/10 dark+non',
        other:
          'dark infuse 25s, self +1 to all Heavy Charge gains 15s, ' +
          '15s: (dark ⤇ p1.6/4 d+n overstrike Heavy)',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Gladiolus - Double Charging...'])).toEqual({
        instant: true,
        other: '1.05-1.1-1.15-1.2-1.3x Heavy dmg @ rank 1-5 15s, Heavy Charge +2',
      });
    });

    it('handles Rage', () => {
      // Discrepancy: MrP formats Gau's default SB as
      // "phys 1.5 automatically for 3 turns"
      // and the others like "auto 3 turns", but I prefer "auto" at the
      // beginning.
      expect(describeEnlirSoulBreak(soulBreaks['Gau - Rage I'])).toEqual({
        damage: 'auto p1.5 Combat (NAT) 3 turns',
      });
      // Discrepancy: MrP doesn't show "slow" here, and for witch abilities,
      // shows it as ", slightly slow cast."  But this format seems useful.
      expect(describeEnlirSoulBreak(soulBreaks['Gau - Meteor Rage'])).toEqual({
        damage: 'AoE phys 6.15/3 rngd',
        other: 'auto slow AoE p2.38/2 rngd Combat 3 turns',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Gau - Gigavolt Rage'])).toEqual({
        damage: 'AoE phys 4.2/4 lgt rngd',
        other: 'auto p2.1 l rngd Combat 3 turns',
      });

      expect(describeEnlirSoulBreak(soulBreaks['Gau - Maul of the Wild'])).toEqual({
        damage: 'phys 7.6/8',
        other: 'self +30% ATK, -30% DEF 25s, fastcast 3',
        burstCommands: [
          {
            damage:
              'auto 30-30-40% AoE p2.25/3 f+n Combat – p2.7/3 f+n Combat – p1.0 f+n Combat 3 turns',
            school: 'Combat',
          },
          {
            other: 'auto 30-30-40% party heal 30% HP – heal 70% HP – heal 30% HP 3 turns',
            school: 'Special',
          },
        ],
      });
    });

    it('handles mimics', () => {
      expect(describeEnlirSoulBreak(soulBreaks['Gogo (V) - Art of Mimicry'])).toEqual({
        other: '50% chance of Mimic, +270 SB pts on success',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Gogo (V) - Sunken Rhapsody'])).toEqual({
        instant: true,
        other: 'water infuse 25s, Mimic 2x, party Haste, Last stand',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Gogo (V) - Deep Aqua Breath'])).toEqual({
        damage: 'AoE magic 11.94/6 water+non',
        other: 'water infuse 25s',
        burstCommands: [
          { other: 'Mimic, +180 SB pts, cast time -0.15s per use', school: 'Special' },
          { damage: 'm8.96/4 wa+n', school: 'Black Magic' },
        ],
      });
      expect(describeEnlirSoulBreak(soulBreaks['Gogo (V) - Deep Imitation'])).toEqual({
        instant: true,
        other: 'water infuse stacking 25s, water infuse 25s, Mimic',
      });
      expect(describeEnlirSoulBreak(soulBreaks['Gogo (VI) - Punishing Meteor'])).toEqual({
        damage: 'p7.6/8 or m17.04/8',
        other: 'party +30% ATK/MAG 25s',
        burstCommands: [
          { fast: true, other: 'Mimic, +180 SB pts', school: 'Special' },
          { damage: 'p2.72/4 or m10.68/4', other: undefined, school: 'Special' },
        ],
      });
    });

    // Test handling of unknown abilities (abilities with ? placeholders).
    // These tests use local, hard-coded data, although we don't extend that
    // to hacking unknown data into the associated skills and statuses.
    //
    // We don't make a thorough and consistent effort to handle all unknowns,
    // but we should at least do the basics.
    it('handles unknown abilities', () => {
      expect(describeEnlirSoulBreak(unknownSoulBreaks[0])).toEqual({
        damage: 'p?/15 or m?/15 fire+wind+non rngd',
        other:
          'fire infuse 25s, self dmg cap=19,999 15s, ' +
          '15s: (3 fire ⤇ p4.24 or m15.35 f+wi+n rngd overstrike), ' +
          '15s: Awoken Fire: fire inf. hones, up to 1.3x dmg @ rank 5, 100% dualcast',
      });
      expect(describeEnlirSoulBreak(unknownSoulBreaks[1])).toEqual({
        damage: 'p?/3 or m?/3 fire+wind overstrike',
      });
      expect(describeEnlirSoulBreak(unknownSoulBreaks[2])).toEqual({
        damage: 'p?/10 or m?/10 rngd',
        other: 'fire infuse 25s, self fastcast 1, 15s: (fire ⤇ p1.68/4 or m7.4/4 f+wi+n rngd)',
      });
      expect(describeEnlirSoulBreak(unknownSoulBreaks[3])).toEqual({
        instant: true,
        damage: 'p?/6 or m?/6 fire+wind+non rngd',
        other: 'fire infuse stacking 25s, fire infuse 25s',
      });
      // Cid Raines' Darkness Shift.  This loses the fact that the Soul Break
      // itself specifies a duration of '?' and instead lists the default
      // status duration, but I think that's okay.
      expect(describeEnlirSoulBreak(unknownSoulBreaks[4])).toEqual({
        instant: true,
        other: 'Darkness hi fastcast 15s',
      });
      // Test handling of numbered status aliases with question marks in place
      // of the number.
      expect(describeEnlirSoulBreak(unknownSoulBreaks[5])).toEqual({
        damage: '? ?/10 ice+non',
        other:
          '+?% ice vuln. 25s, ice infuse 25s, party Reflect Dmg 75% as ice 30s, self fastcast 3',
      });
      // Test handling of numbered status aliases with a question mark after
      // the number.  As with Darkness Shift, this discards the 15? second
      // duration, but I think that's okay.
      expect(describeEnlirSoulBreak(unknownSoulBreaks[6])).toEqual({
        instant: true,
        damage: '? ?/6 earth+non',
        other: '+10?% earth vuln. 25s, self +10% earth dmg 15s',
      });
    });
  });
});

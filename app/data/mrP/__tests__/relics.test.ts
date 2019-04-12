import { describeRelicEffect } from '../relics';

describe('mrp/Relics', () => {
  describe('describeRelicEffect', () => {
    it('converts relic effects', () => {
      function check(enlirEffect: string, expected: string) {
        expect(describeRelicEffect(enlirEffect)).toEqual(expected);
      }

      expect(describeRelicEffect(null)).toEqual(null);
      check('Blind and Instant KO immunity (moderate)', '++Blind/KO res');
      check('Chance to cause Blind', '% Blind');
      check('Blind, Paralyze, and Petrify immunity (moderate)', '++Blind/Paralyze/Petrify res');
      check('Chance to cause Confuse, RS: Wind damage +20%', '% Confuse, RS +wind dmg');
      check(
        'Chance to cause Poison, RS: Poison damage +20%, RS: chance to cause Petrify',
        '% Poison, RS +bio dmg, RS % Petrify',
      );
      check('Chance to cause Sleep (15%)', '% Sleep');
      check(
        'Chance to increase Gysahl Greens by 50%, RS: Wind damage +20%',
        '% Gysahl, RS +wind dmg',
      );
      check('Confuse, Instant KO and Stun immunity (minor)', '+Confuse/KO/Stun res');
      check(
        'Dark and Poison resistance, Confuse immunity (mod.), Lightning and Holy weakness',
        '++dark/bio res, ++Confuse res, lgt/holy weak',
      );
      check('Dark damage +20%, RS: chance to cause Blind', '+dark dmg, RS % Blind');
      check('Dark resistance (major)', '+++dark res');
      check(
        'Fire and Earth resistance, Paralyze immunity (moderate), Water and Ice weakness',
        '++fire/earth res, ++Paralyze res, water/ice weak',
      );
      check('Fire and Ice resistance (minor)', '+fire/ice res');
      check('HP +1000', 'HP +1000');
      check('HP +300, Poison immunity (moderate)', 'HP +300, ++Poison res');
      check('Instant KO immunity (moderate), HP +700', '++KO res, HP +700');
      check(
        'RS: Fire, Ice, Lightning, Earth, Wind, Water, Holy, Dark, Poison and NE damage +20%',
        'RS +elem/non dmg',
      );
      check('Stop, Stun and Sap immunity (minor), Holy weakness', '+Stop/Stun/Sap res, holy weak');
      check('RS: Fire damage +20%, RS: Lightning damage +20%', 'RS +fire dmg, RS +lgt dmg');
      check('RS: Fire, Ice and Lightning resistance (minor)', 'RS +fire/ice/lgt res');
    });
  });
});

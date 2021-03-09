import { exportSoulBreaksToCsv } from '../exporters';
import { IState } from '../../reducers';
import { makeTestState } from '../../reducers/__fixtures__/testState';

describe('exporters', () => {
  describe(exportSoulBreaksToCsv, () => {
    it('exports soul breaks', () => {
      const state = makeTestState({
        characters: {
          characters: {
            10100100: {
              id: 10100100,
              level: 99,
              levelCap: 99,
              name: 'Warrior of Light',
              uniqueId: 1,
            },
          },
          soulBreaks: [20330007],
        },
      });
      expect(exportSoulBreaksToCsv((state as any) as IState)).toMatchInlineSnapshot(`
        "ID,Character,Realm,Soul Break,Tier,Effects
        20330007,Warrior of Light,I,Shield of Light,CSB1,\\"holy chain 1.2x (max 99), phys 7.92/11 holy, party Autoheal 2k\\"
        "
      `);
    });
  });
});

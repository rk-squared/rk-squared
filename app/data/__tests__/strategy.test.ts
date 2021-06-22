import * as fs from 'fs-extra';
import * as path from 'path';
import { parseBattleTips } from '../strategy';

describe('strategy', () => {
  describe(parseBattleTips, () => {
    it('parses battle tips', async () => {
      const content = await fs.readFile(
        path.join(__dirname, 'data', 'redGiantCatoblepasHtmlContent.html'),
        'utf-8',
      );
      const result = parseBattleTips(content);
      expect(result).toMatchInlineSnapshot(`
        Array [
          Object {
            "absorb": undefined,
            "name": "Red Giant",
            "null": undefined,
            "resist": undefined,
            "weak": undefined,
          },
          Object {
            "absorb": Array [
              "Lightning",
            ],
            "name": "Catoblepas",
            "null": undefined,
            "resist": undefined,
            "weak": Array [
              "Earth",
              "Water",
            ],
          },
        ]
      `);
    });
  });
});

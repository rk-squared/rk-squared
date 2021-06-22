import * as fs from 'fs-extra';
import * as path from 'path';
import { parseBattleTips, sanitizeBattleMessage } from '../strategy';

function readTestFile(baseName: string) {
  return fs.readFile(path.join(__dirname, 'data', baseName), 'utf-8');
}

describe('strategy', () => {
  describe(parseBattleTips, () => {
    it('parses battle tips', async () => {
      const content = await readTestFile('redGiantCatoblepasHtmlContent.html');
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

  describe(sanitizeBattleMessage, () => {
    it('sanitizes battle messages', async () => {
      const content = await readTestFile('guardScorpionMessage.html');
      expect(sanitizeBattleMessage(content)).toMatchInlineSnapshot(
        `"<ul><li>The enemy uses only attacks that <strong>ignore Defense and Resistance</strong>.</li><li>-The enemy has a high chance to counter <strong>physical attacks</strong> with <strong>Reverse Laser</strong>.</li><li>-The enemy has low <strong>Defense</strong>.</li><li>-The enemy uses strong <strong>lightning</strong> attacks.</li><li>-The enemy uses attacks that <strong>Berserk</strong> and <strong>Interrupt</strong>.</li></ul>"`,
      );
    });
  });
});

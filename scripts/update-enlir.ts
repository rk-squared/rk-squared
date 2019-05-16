#!/usr/bin/env npx ts-node
import { google, sheets_v4 } from 'googleapis';
import * as _ from 'lodash';
import * as yargs from 'yargs';

import {
  authorize,
  enlirSpreadsheetIds,
  loadEnlirCredentials,
  rowColToCellId,
} from './enlirClient';
import { logger } from './logger';

interface SheetData {
  range: string;
  majorDimension: string;
  values: string[][];
}

// #FBD4B4
const releasedColor = {
  red: 251 / 255,
  green: 212 / 255,
  blue: 180 / 255,
};

function getColumns({ values }: SheetData): _.Dictionary<number> {
  return _.fromPairs(values[0].map((col, i) => [col, i]));
}

function makeRowLookup(
  { values }: SheetData,
  cols: _.Dictionary<number>,
): _.Dictionary<number | null> {
  const idCol = cols['ID'];
  const nameCol = cols['Name'];
  const isRW = cols['Tier'] ? (row: string[]) => row[cols['Tier']] === 'RW' : _.constant(false);

  const result: _.Dictionary<number | null> = {};
  for (let i = 1; i < values.length; i++) {
    const id = values[i][idCol];
    const name = values[i][nameCol];
    if (id) {
      if (result[id]) {
        // The "Chronicles of the Water Crystal" RW soul break is legitimately duplicated.
        if (!isRW(values[i])) {
          logger.warn(`Duplicate ID ${id} (${name})`);
        }
      } else {
        result[id] = i;
      }
    }

    if (name) {
      if (result[name] !== undefined) {
        // Duplicate names may happen - mark as null to indicate that it's ambiguous.
        result[name] = null;
      } else {
        result[name] = i;
      }
    }
  }
  return result;
}

async function getSheetId(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetName: string,
): Promise<number> {
  const sheetsRes = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets/properties',
  });
  const sheet = sheetsRes.data.sheets!.find(
    i => i.properties != null && i.properties.title === sheetName,
  );
  if (!sheet) {
    throw new Error(`Failed to find tab ${sheetName}`);
  }
  if (!sheet.properties || sheet.properties.sheetId == null) {
    throw new Error(`Failed to get sheet ID for tab ${sheetName}`);
  }
  return sheet.properties.sheetId;
}

async function main() {
  const enlirCredentials = await loadEnlirCredentials();
  if (!enlirCredentials) {
    return;
  }

  const auth = await authorize(enlirCredentials, true);
  const sheets = google.sheets({ version: 'v4', auth });

  // tslint:disable-next-line: no-unused-expression
  yargs
    .option('sheet', {
      default: 'community',
      choices: Object.keys(enlirSpreadsheetIds),
      description: 'Sheets to download: original Enlir data or new Community sheet.',
      type: 'string',
    })
    .command(
      'releaseInGl <tab> [item..]',
      'mark entities as released in GL',
      y =>
        y
          .positional('tab', {
            describe: 'sheet tab name',
            type: 'string',
          })
          .positional('item', {
            describe: 'entity ID or name',
            type: 'string',
          })
          .array('item')
          .required('item'),
      async argv => {
        const spreadsheetId = enlirSpreadsheetIds[argv.sheet];
        const sheetName = _.startCase(argv.tab);

        const sheetId = await getSheetId(sheets, spreadsheetId, sheetName);

        const valuesRes = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: sheetName,
        });
        const values = valuesRes.data as SheetData;
        const cols = getColumns(values);
        const rowLookup = makeRowLookup(values, cols);

        for (const item of argv.item) {
          logger.info(`Marking as released in GL: ${item}`);
          const row = rowLookup[item];
          if (!row) {
            logger.warn(`Failed to find ${item}; skipping`);
            continue;
          }

          const glRange = sheetName + '!' + rowColToCellId(row, cols['GL']);
          const glResponse = await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: glRange,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [['✓']],
            },
          });
          if (!glResponse.data || glResponse.data.updatedCells !== 1) {
            logger.error('Update failed');
          }

          const colorEndColumn = Math.max(cols['Name'], cols['Realm']) + 1;
          await sheets.spreadsheets.batchUpdate(
            {
              spreadsheetId,
              requestBody: {
                requests: [
                  {
                    updateCells: {
                      fields: 'userEnteredFormat/backgroundColor',
                      range: {
                        sheetId,
                        startRowIndex: row,
                        startColumnIndex: 0,
                        endRowIndex: row + 1,
                        endColumnIndex: colorEndColumn,
                      },
                      rows: [
                        {
                          values: _.times(
                            colorEndColumn,
                            _.constant({
                              userEnteredFormat: {
                                backgroundColor: releasedColor,
                              },
                            }),
                          ),
                        },
                      ],
                    },
                  },
                ],
              },
            },
            {},
          );
        }
      },
    ).argv;
}

// tslint:disable-next-line: no-console
main().catch(e => console.error(e));

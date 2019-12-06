#!/usr/bin/env -S npx ts-node
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

function matchRelic(
  mainCols: _.Dictionary<number>,
  mainRow: string[],
  refCols: _.Dictionary<number>,
  refRow: string[],
) {
  const name = mainRow[mainCols['Name']];
  const realm = mainRow[mainCols['Realm']];
  const relic = refRow[refCols['Relic']];
  const regex = new RegExp(
    `^${_.escapeRegExp(name)}(?: \\(.*?\\))? \\(${_.escapeRegExp(realm)}\\)$`,
  );
  return regex.test(relic);
}

function makeGenericMatcher(column: string) {
  return (
    mainCols: _.Dictionary<number>,
    mainRow: string[],
    refCols: _.Dictionary<number>,
    refRow: string[],
  ) => {
    const name = mainRow[mainCols['Name']];
    const character = mainRow[mainCols['Character']];
    return refRow[refCols[column]] === name && refRow[refCols['Character']] === character;
  };
}

const matchLegendMateria = makeGenericMatcher('Legend Materia');
const matchSoulBreak = makeGenericMatcher('Soul Break');
const matchSource = makeGenericMatcher('Source');

const formatRelic = (value: string, mainCols: _.Dictionary<number>, mainRow: string[]) =>
  value + ' (' + mainRow[mainCols['Realm']] + ')';

interface SheetRenameDetails {
  tab: string;
  column: string;
  missingOk?: boolean;
  enabled: (mainCols: _.Dictionary<number>, mainRow: string[]) => boolean;
  match: (
    mainCols: _.Dictionary<number>,
    mainRow: string[],
    refCols: _.Dictionary<number>,
    refRow: string[],
  ) => boolean;
  format?: (value: string, mainCols: _.Dictionary<number>, mainRow: string[]) => string;
}

interface SheetRenameReference {
  refs: SheetRenameDetails[];
}

// TODO: Invert the match - e.g., if we're asked to rename a relic, then
// looking for a soul break with the matching relic name from the Relics tab
// will fail if the relic name was inconsistently updated, but looking for a
// soul break with the matching soul break name should work.
const sheetRenameReferences: { [tab: string]: SheetRenameReference } = {
  relics: {
    refs: [
      {
        tab: 'soulBreaks',
        column: 'Relic',
        enabled: (mainCols: _.Dictionary<number>, mainRow: string[]) =>
          !!mainRow[mainCols['Soul Break']],
        match: matchRelic,
        format: formatRelic,
      },
      {
        tab: 'legendMateria',
        column: 'Relic',
        enabled: (mainCols: _.Dictionary<number>, mainRow: string[]) =>
          !!mainRow[mainCols['Legend Materia']],
        match: matchRelic,
        format: formatRelic,
      },
    ],
  },
  soulBreaks: {
    refs: [
      {
        tab: 'relics',
        column: 'Soul Break',
        enabled: _.constant(true),
        match: matchSoulBreak,
      },
      // Omit Burst: No new BSBs are coming out, so we won't be changing any
      // names.
      {
        tab: 'brave',
        column: 'Source',
        enabled: (mainCols: _.Dictionary<number>, mainRow: string[]) =>
          /Brave Mode/.test(mainRow[mainCols['Effects']]),
        match: matchSource,
      },
      {
        tab: 'synchro',
        column: 'Source',
        enabled: (mainCols: _.Dictionary<number>, mainRow: string[]) =>
          mainRow[mainCols['Tier']] === 'SASB',
        match: matchSource,
      },
    ],
  },
  legendMateria: {
    refs: [
      {
        tab: 'relics',
        column: 'Legend Materia',
        enabled: _.constant(true),
        match: matchLegendMateria,
      },
    ],
  },
};

function nthElement<T>(items: T[], n: number, offset: number = 0): T[] {
  return items.filter((element, index) => index % n === offset);
}

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

async function getSheetData(sheets: sheets_v4.Sheets, spreadsheetId: string, range: string) {
  const valuesRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return valuesRes.data as SheetData;
}

async function setSingleCell(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetName: string,
  row: number,
  col: number,
  newValue: string,
) {
  const range = sheetName + '!' + rowColToCellId(row, col);
  logger.debug(`Setting ${range} to ${newValue}`);
  const response = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[newValue]],
    },
  });
  if (!response.data || response.data.updatedCells !== 1) {
    logger.error('Update failed');
  }
}

async function releaseInGl(sheets: sheets_v4.Sheets, sheet: string, tab: string, items: string[]) {
  const spreadsheetId = enlirSpreadsheetIds[sheet];
  const sheetName = _.startCase(tab);

  const sheetId = await getSheetId(sheets, spreadsheetId, sheetName);

  const values = await getSheetData(sheets, spreadsheetId, sheetName);
  const cols = getColumns(values);
  const rowLookup = makeRowLookup(values, cols);

  for (const item of items) {
    logger.info(`Marking as released in GL: ${item}`);
    const row = rowLookup[item];
    if (!row) {
      logger.warn(`Failed to find ${item}; skipping`);
      continue;
    }

    await setSingleCell(sheets, spreadsheetId, sheetName, row, cols['GL'], '✓');

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
}

async function rename(
  sheets: sheets_v4.Sheets,
  sheet: string,
  tab: string,
  fromTo: Array<[string, string]>,
) {
  const spreadsheetId = enlirSpreadsheetIds[sheet];

  // Rename the item itself.
  const mainSheetName = _.startCase(tab);
  const mainValues = await getSheetData(sheets, spreadsheetId, mainSheetName);
  const mainCols = getColumns(mainValues);
  const mainRowLookup = makeRowLookup(mainValues, mainCols);

  for (const [fromNameOrId, toName] of fromTo) {
    logger.info(`Renaming ${fromNameOrId} to ${toName}`);
    const row = mainRowLookup[fromNameOrId];
    if (!row) {
      logger.warn(`Failed to find ${fromNameOrId}; skipping`);
      continue;
    }

    await setSingleCell(sheets, spreadsheetId, mainSheetName, row, mainCols['Name'], toName);
  }

  // Rename references in other tabs.
  for (const ref of sheetRenameReferences[tab].refs) {
    logger.info(`Checking references in ${ref.tab}`);
    const refSheetName = _.startCase(ref.tab);
    const refValues = await getSheetData(sheets, spreadsheetId, refSheetName);
    const refCols = getColumns(refValues);
    for (const [fromNameOrId, toName] of fromTo) {
      logger.info(`Renaming ${fromNameOrId} to ${toName} in ${ref.tab}`);
      const mainRowIndex = mainRowLookup[fromNameOrId];
      if (!mainRowIndex) {
        logger.warn(`Failed to find ${fromNameOrId}; skipping`);
        continue;
      }
      const mainRow = mainValues.values[mainRowIndex];
      if (!ref.enabled(mainCols, mainRow)) {
        logger.info("Doesn't apply; skipping");
        continue;
      }

      const refRowIndex = _.findIndex(refValues.values, (row: string[]) =>
        ref.match(mainCols, mainRow, refCols, row),
      );
      if (refRowIndex === -1) {
        logger.info(`Failed to find ${fromNameOrId} in ${ref.tab}`);
        continue;
      }

      const newCellValue = ref.format ? ref.format(toName, mainCols, mainRow) : toName;
      await setSingleCell(
        sheets,
        spreadsheetId,
        refSheetName,
        refRowIndex,
        refCols[ref.column],
        newCellValue,
      );
    }
  }
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
    .strict()
    .option('sheet', {
      default: 'community',
      choices: Object.keys(enlirSpreadsheetIds),
      description: 'Sheets to download: original Enlir data or new Community sheet.',
      type: 'string',
    })
    .command(
      'releaseInGl <tab> [items..]',
      'mark entities as released in GL',
      y =>
        y
          .positional('tab', {
            describe: 'sheet tab name',
            type: 'string',
          })
          .positional('items', {
            describe: 'entity ID or name',
            type: 'string',
          })
          .array('items')
          .required('items'),
      async argv => releaseInGl(sheets, argv.sheet, argv.tab, argv.items),
    )
    .command(
      'rename <tab> [from_to..]',
      'rename entities',
      y =>
        y
          .positional('tab', {
            describe: 'sheet tab name',
            type: 'string',
          })
          .positional('from_to', {
            describe: 'entity ID or name',
            type: 'string',
          })
          .array('from_to')
          .required('from_to')
          .coerce('from_to', (fromTo: string[]) => {
            if (fromTo.length % 2) {
              throw new Error('Please provide pairs of from (an entity ID or name) and to');
            }
            return _.zip(nthElement(fromTo, 2, 0), nthElement(fromTo, 2, 1));
          }),
      async argv => rename(sheets, argv.sheet, argv.tab, argv.from_to),
    ).argv;
}

// tslint:disable-next-line: no-console
main().catch(e => console.error(e));

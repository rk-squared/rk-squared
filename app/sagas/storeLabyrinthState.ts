import { takeEvery, select, call } from 'redux-saga/effects';
import { getType } from 'typesafe-actions';
import * as fs from 'fs';
import * as path from 'path';
import {
  setLabyrinthChests,
  clearLabyrinthChests,
  clearLabyrinthCombat,
  setLabyrinthPartyFatigues,
  setLabyrinthPaintings,
  LabyrinthPainting
} from '../actions/labyrinth';
import { logger } from '../utils/logger';
import { IState } from '../reducers';
import { LabyrinthState } from '../reducers/labyrinth';
import { getStoragePath } from '../proxy/util'
import { DisplayPaintingId } from '../api/schemas/labyrinth';

const schemaLookup = {
  chest: ["left", "center", "right"],
  combat: ["enemy", "totalFatigue1", "totalFatigue2", "totalFatigue3"],
  painting: ["remaining", "hasPortal", "hasMaster", "canSkipExploration", "futureTreasure", "futureExploration"]
}

function getCaptureFilename(stateType: string) {
  const capturePath: string = getStoragePath('state');
  return path.join(capturePath, stateType + ".txt");
}

function writeFile(type: string, text: any) {
  const filename = getCaptureFilename(type);
  return fs.promises.writeFile(filename, text)
    .then(() => logger.debug(`Saved to ${filename}`))
    .catch((err) => logger.error(`Failed to save ${type} state: ${err}`));
}

const execWriteFile = (type: string, text: any) => writeFile(type, text);

function removeFile(type: string) {
  const filename = getCaptureFilename(type);
  if (fs.existsSync(filename)) {
    return fs.promises.unlink(filename)
      .then(() => logger.debug(`Removed ${filename}`))
      .catch((err) => logger.error(`Failed to clear ${type} state: ${err}`));
  }
  else {
    return Promise.resolve();
  }
}

const execRemoveFile = (type: string) => removeFile(type);

export function* saveChestState(action: ReturnType<typeof setLabyrinthChests>) {
  const chests = action.payload;
  const chestTypes = chests.map(c => Math.floor(c / 100000));
  const text = chestTypes.join(',') + "\n" + schemaLookup.chest.join(',');
  yield call(execWriteFile, 'chest', text);
}

export function* clearChestState() {
  yield call(execRemoveFile, 'chest');
}

export function* saveCombatPartyState() {
  const ladyrinth: LabyrinthState = yield select((state: IState) => state.labyrinth);
  if (!ladyrinth.combat) {
    logger.error(`Failed to load combat state`);
    return;
  }

  if (!ladyrinth.parties) {
    logger.error(`Failed to load parties state`);
  }

  if (!ladyrinth.fatigues) {
    logger.error(`Failed to load fatigues state`);
  }

  const maxFatigue = 50;
  let partyFatigues = [maxFatigue, maxFatigue, maxFatigue];
  if (ladyrinth.parties && ladyrinth.fatigues) {
    const fatigues = ladyrinth.fatigues;
    partyFatigues = ladyrinth.parties.map(
      m => m.buddies.reduce(
        (p, c) => p + (fatigues[String(c)] ?? 0), 0));
  }

  const combatName: Array<number | string> = [ladyrinth.combat.name];
  const partyState = combatName.concat(partyFatigues);
  const text = partyState.join(',') + "\n" + schemaLookup.combat.join(',');
  yield call(execWriteFile, 'combat', text);
}

export function* savePaintingState(action: ReturnType<typeof setLabyrinthPaintings>) {
  const remaining = action.payload.remaining;
  const paintings = action.payload.paintings;

  if (!paintings) {
    logger.error(`Failed to load painting state`);
    return;
  }
  const perRow = 3;
  const explorationIds = [DisplayPaintingId.Exploration1, DisplayPaintingId.Exploration2, DisplayPaintingId.Exploration3];
  const treasureIds = [DisplayPaintingId.Treasure1, DisplayPaintingId.Treasure2, DisplayPaintingId.Treasure3, DisplayPaintingId.Treasure4,
  DisplayPaintingId.Treasure5, DisplayPaintingId.Treasure6, DisplayPaintingId.Treasure7, DisplayPaintingId.Treasure8];
  let hasPortal = false;
  let hasMaster = false;
  let causeFloorEnd = true;
  let futureTreasure = 0;
  let futureExploration = 0
  const treasureRecord: Record<string, number> = { "2": 0, "3": 0 };
  const exploreRecord: Record<string, number> = { "2": 0, "3": 0 };
  for (let i = 0; i < paintings.length; i++) {
    const painting = paintings[i];
    if (i < perRow) {
      const isPortal = painting.id == DisplayPaintingId.Portal;
      const isMaster = painting.id == DisplayPaintingId.Master;
      hasPortal = hasPortal || isPortal;
      hasMaster = hasMaster || isMaster;
      causeFloorEnd = causeFloorEnd && (explorationIds.includes(painting.id) || isPortal || isMaster);
    } else {
      const pushPainting = hasMaster || hasPortal;
      const currentRow = String(Math.ceil((i + 1) / perRow));

      checkPaintingAccess(paintings, i, currentRow, treasureRecord, pushPainting, treasureIds);
      checkPaintingAccess(paintings, i, currentRow, exploreRecord, pushPainting, explorationIds);
      //logger.debug(`Current ${i} row ${currentRow} treasure ${treasureRecord[currentRow]} explore ${exploreRecord[currentRow]}`);
    }
  }

  futureTreasure = Object.entries(treasureRecord).reduce((p, c) => p + (c[1] > 0 ? 1 : 0), 0);
  futureExploration = Object.entries(exploreRecord).reduce((p, c) => p + (c[1] > 0 ? 1 : 0), 0);

  const data = [remaining, hasPortal, hasMaster, !causeFloorEnd, futureTreasure, futureExploration];
  const text = data.join(',') + "\n" + schemaLookup.painting.join(',');
  yield call(execWriteFile, 'painting', text);
}

function checkPaintingAccess(paintings: LabyrinthPainting[], index: number, row: string, record: Record<string, number>, pushPainting: boolean, checkIds: DisplayPaintingId[]) {
  if (checkIds.includes(paintings[index].id)) {
    record[row] = record[row] + 1;
    if (pushPainting && index % 2 == 0) { //when painting index at 3-4, 5-6, 7-8
      const previous = paintings[index - 1];
      if (checkIds.includes(previous.id)) {
        record[row] = record[row] - 1;
      }
    }
  }
}

export function* clearCombatPartyState() {
  yield call(execRemoveFile, 'combat');
}

export function* watchLabyrinthState() {
  yield takeEvery(getType(setLabyrinthChests), saveChestState);
  yield takeEvery(getType(clearLabyrinthChests), clearChestState);
  yield takeEvery(getType(setLabyrinthPartyFatigues), saveCombatPartyState);
  yield takeEvery(getType(clearLabyrinthCombat), clearCombatPartyState);
  yield takeEvery(getType(setLabyrinthPaintings), savePaintingState);
}
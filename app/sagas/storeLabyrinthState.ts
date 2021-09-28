import { takeEvery, select, call } from 'redux-saga/effects';
import { getType } from 'typesafe-actions';
import * as fs from 'fs';
import * as path from 'path';
import {
  setLabyrinthChests,
  clearLabyrinthChests,
  clearLabyrinthCombat,
  setLabyrinthPartyFatigues
} from '../actions/labyrinth';
import { logger } from '../utils/logger';
import { IState } from '../reducers';
import { LabyrinthState } from '../reducers/labyrinth';
import { getStoragePath } from '../proxy/util'

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
  const text = chestTypes.join(',');
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
    return;
  }

  if (!ladyrinth.fatigues) {
    logger.error(`Failed to load fatigues state`);
    return;
  }

  const fatigues = ladyrinth.fatigues;
  const partyFatigues = ladyrinth.parties.map(
    m => m.buddies.reduce(
      (p, c) => p + (fatigues[c] ?? 0), 0));
  const combatName: Array<number | string> = [ladyrinth.combat.name];
  const partyState = combatName.concat(partyFatigues);
  const text = partyState.join(',');
  yield call(execWriteFile, 'combat', text);
}

export function* clearCombatPartyState() {
  yield call(execRemoveFile, 'combat');
}

export function* watchLabyrinthState() {
  yield takeEvery(getType(setLabyrinthChests), saveChestState);
  yield takeEvery(getType(clearLabyrinthChests), clearChestState);
  yield takeEvery(getType(setLabyrinthPartyFatigues), saveCombatPartyState);
  yield takeEvery(getType(clearLabyrinthCombat), clearCombatPartyState);
}
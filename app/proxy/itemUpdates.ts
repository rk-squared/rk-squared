/**
 * @file
 * Support for listening in on new items
 *
 * FIXME: We should record new items ourselves, to make the program more self-healing
 */

import { Store } from 'redux';

import * as _ from 'lodash';

import { LangType } from '../api/apiUrls';
import * as schemas from '../api/schemas';
import * as gachaSchemas from '../api/schemas/gacha';
import { enlir } from '../data';
import { dressRecordsById } from '../data/dressRecords';
import { EnlirLegendMateria, EnlirRelic, EnlirSoulBreak } from '../data/enlir';
import { items, ItemType, ItemTypeLookup } from '../data/items';
import { IState } from '../reducers';
import { logger } from '../utils/logger';
import { getRequestLang, Handler, HandlerRequest } from './common';

let localItems = _.clone(items);
const localItemsById = _.zipObject(items.map(i => i.id), localItems);

interface PrizeItem {
  type_name: schemas.ItemTypeName;
  name: string;
  id: number;
  image_path: string;
}

function showUnknownItem(item: PrizeItem) {
  logger.warn(`Unknown ${item.type_name.toLowerCase()}: ${item.name} (ID ${item.id})`);
}

function addLocalItem({ name, type_name, id }: PrizeItem) {
  const type = ItemTypeLookup[type_name] || type_name;
  const newItem = { name, type, id };
  localItems.push(newItem);
  localItems = _.sortBy(localItems, 'id');
  localItemsById[id] = newItem;
}

function showLocalItem(item: PrizeItem) {
  const type = ItemTypeLookup[item.type_name] || item.type_name;
  logger.info(
    'New (previously unknown) item:\n' +
      `{\n  name: '${item.name}',\n  type: ItemType.${type},\n  id: ${item.id}\n},`,
  );
}

function showLocalDressRecord({
  dress_record_id,
  name,
  buddy_id,
}: {
  dress_record_id: number;
  name: string;
  buddy_id: number;
}) {
  logger.info(
    'New (previously unknown) dress record:\n' +
      `{\n  name: '${name}',\n  id: ${dress_record_id},\n  characterId: ${buddy_id},\n},`,
  );
}

function checkKnownEnlir(item: PrizeItem, enlirData: any) {
  if (enlirData[item.id] == null) {
    showUnknownItem(item);
  }
}

function checkKnownDressRecord(item: PrizeItem) {
  if (dressRecordsById[item.id] == null) {
    const match = item.image_path.match(/(\d+)\/\d+\/\d+\.png/);
    const buddyId = match ? +match[1] : 0;
    showLocalDressRecord({ dress_record_id: item.id, name: item.name, buddy_id: buddyId });
  }
}

function checkKnownItems(item: PrizeItem) {
  if (localItemsById[item.id] == null) {
    if (item.type_name === 'MUSIC_TICKET') {
      // Music tickets are regularly released and are easy to dynamically add,
      // so we won't try tracking them ourselves.
      return;
    }
    showUnknownItem(item);
    addLocalItem(item);
    showLocalItem(item);
  }
}

function checkItem(item: PrizeItem) {
  if (item.type_name === 'BEAST') {
    checkKnownEnlir(item, enlir.magicites);
  } else if (item.type_name === 'EQUIPMENT') {
    checkKnownEnlir(item, enlir.relics);
  } else if (item.type_name === 'ABILITY') {
    checkKnownEnlir(item, enlir.abilities);
  } else if (
    item.type_name === 'BUDDY' ||
    item.type_name === 'MEMORY_CRYSTAL' ||
    item.type_name === 'RECORD_MATERIA'
  ) {
    // FIXME: Need an internal-id-indexed version of characters, memory crystals, record materia
  } else if (item.type_name === 'DRESS_RECORD') {
    checkKnownDressRecord(item);
  } else {
    checkKnownItems(item);
  }
}

function checkPartyItems(
  partyItems: Array<{ name: string; id: number; image_path: string }>,
  type: ItemType,
) {
  for (const i of _.sortBy(partyItems, 'id')) {
    checkKnownItems({
      name: i.name,
      id: i.id,
      type_name: type.toUpperCase() as schemas.ItemTypeName,
      image_path: i.image_path,
    });
  }
}

function checkPartyDressRecords(data: schemas.PartyList | schemas.PartyListOther) {
  for (const i of _.sortBy(data.dress_records, 'dress_record_id')) {
    if (dressRecordsById[i.dress_record_id] == null) {
      showLocalDressRecord(i);
    }
  }
}

function checkAllPartyItems(data: schemas.PartyList | schemas.PartyListOther) {
  // No need to check isRecordDungeonPartyList, as long as we're only
  // looking for new / previously unknown items.
  checkPartyItems(data.equipment_hyper_evolve_materials, ItemType.DarkMatter);
  checkPartyItems(data.equipment_sp_materials, ItemType.UpgradeMaterial);
  checkPartyItems(data.materials, ItemType.Orb);
  checkPartyItems(data.grow_eggs, ItemType.GrowthEgg);
  checkPartyItems(data.sphere_materials, ItemType.Mote);
  checkPartyDressRecords(data);
}

function handleWinBattle(data: schemas.WinBattle) {
  _.forEach(data.result.prize_master, item => {
    checkItem({
      id: +item.item_id,
      type_name: item.type_name,
      name: item.name,
      image_path: item.image_path,
    });
  });
}

interface CheckedEntity<T> {
  enlirItem: T;
  updateRelease: boolean;
  updateName: string | undefined;
}

function compareGlEntity<
  T1 extends { id: number; name: string },
  T2 extends { name: string; gl: boolean }
>(
  callback: (message: string) => void,
  item: T1,
  enlirItems: { [id: number]: T2 },
  description: string,
  source: string,
  trimRe?: RegExp,
): CheckedEntity<T2> | null {
  const enlirItem = enlirItems[item.id];
  if (!enlirItem) {
    callback(`Item update: Unknown ${description} ID ${item.id}, ${item.name}, from ${source}`);
    return null;
  }

  let updateRelease = false;
  if (!enlirItem.gl) {
    callback(`Item update: ${description} ID ${item.id}, ${item.name}, is now released in global`);
    updateRelease = true;
  }

  const trimmedName = trimRe ? item.name.replace(trimRe, '') : item.name.trimRight();
  let updateName: string | undefined;
  if (enlirItem.name !== trimmedName) {
    callback(
      `Item update: ${description} ID ${item.id}, ${item.name}, ` +
        `is named ${enlirItem.name} in Enlir`,
    );
    updateName = item.name;
  }

  return {
    enlirItem,
    updateRelease,
    updateName,
  };
}

function showUpdateCommands<T extends { id: number }>(
  checked: Array<CheckedEntity<T>>,
  tabName: string,
  callback: (message: string) => void,
) {
  const releaseIds = checked.filter(i => i.updateRelease).map(i => i.enlirItem.id);
  if (releaseIds.length) {
    callback(`update-enlir.ts releaseInGl ${tabName} ${releaseIds.join(' ')}`);
  }
}

function checkGlRelicDrawBannerItems(
  data: gachaSchemas.GachaShow,
  currentTime: number,
  callback: (message: string) => void,
) {
  const checkedRelics: Array<CheckedEntity<EnlirRelic>> = [];
  const checkedSoulBreaks: Array<CheckedEntity<EnlirSoulBreak>> = [];
  const checkedLegendMateria: Array<CheckedEntity<EnlirLegendMateria>> = [];

  for (const i of data.series_list) {
    if (i.opened_at > currentTime / 1000) {
      continue;
    }
    for (const { equipment } of i.banner_list) {
      if (!equipment) {
        continue;
      }
      const { id, name, soul_strike, legend_materia } = equipment;
      const relicName = `relic ${name} (ID ${id})`;

      const compareRelic = compareGlEntity(
        callback,
        equipment,
        enlir.relics,
        'relic',
        relicName,
        / \(.*\) */,
      );
      if (!compareRelic) {
        continue;
      }
      checkedRelics.push(compareRelic);
      if (soul_strike) {
        const compareSoulBreak = compareGlEntity(
          callback,
          soul_strike,
          enlir.soulBreaks,
          'soul break',
          relicName,
        );
        if (compareSoulBreak) {
          checkedSoulBreaks.push(compareSoulBreak);
        }
      }
      if (legend_materia) {
        const compareLegendMateria = compareGlEntity(
          callback,
          legend_materia,
          enlir.legendMateria,
          'legend materia',
          relicName,
          / \(.*\) */,
        );
        if (compareLegendMateria) {
          checkedLegendMateria.push(compareLegendMateria);
        }
      }
    }
  }

  showUpdateCommands(checkedRelics, 'relics', callback);
  showUpdateCommands(checkedSoulBreaks, 'soulBreaks', callback);
  showUpdateCommands(checkedLegendMateria, 'legendMateria', callback);
}

const itemUpdatesHandler: Handler = {
  dungeons(data: schemas.Dungeons) {
    for (const d of data.dungeons) {
      _.forEach(d.prizes, prizeList => {
        for (const prize of prizeList) {
          checkItem(prize);
        }
      });
    }
  },

  'party/list': checkAllPartyItems,
  'party/list_other': checkAllPartyItems,

  win_battle: handleWinBattle,
  battle_win: handleWinBattle,
  'battle/win': handleWinBattle,

  'gacha/show'(data: gachaSchemas.GachaShow, store: Store<IState>, request: HandlerRequest) {
    if (getRequestLang(request) === LangType.Gl) {
      const currentTime = store.getState().timeState.currentTime;

      const results: string[] = [];
      const callback = (message: string) => results.push(message);

      checkGlRelicDrawBannerItems(data, currentTime, callback);

      results.sort().forEach(i => logger.info(i));
    }
  },
};

export default itemUpdatesHandler;

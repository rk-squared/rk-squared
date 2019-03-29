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

function compareGlEntity<
  T1 extends { id: number; name: string },
  T2 extends { name: string; gl: boolean }
>(
  item: T1,
  enlirItems: { [id: number]: T2 },
  description: string,
  source: string,
  trimRe?: RegExp,
) {
  const enlirItem = enlirItems[item.id];
  if (!enlirItem) {
    logger.info(`Item update: Unknown ${description} from ${source}: ${item.name} (ID ${item.id})`);
    return null;
  }

  if (!enlirItem.gl) {
    logger.info(
      `Item update: ${description} ${item.name} (ID ${item.id}) is now released in global`,
    );
  }
  const trimmedName = trimRe ? item.name.replace(trimRe, '') : item.name.trimRight();
  if (enlirItem.name !== trimmedName) {
    logger.info(
      `Item update: ${description} ${item.name} (ID ${item.id}) ` +
        `is named ${enlirItem.name} in Enlir`,
    );
  }
  return enlirItem;
}

function checkGlRelicDrawBannerItems(data: gachaSchemas.GachaShow, currentTime: number) {
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

      const enlirRelic = compareGlEntity(equipment, enlir.relics, 'relic', relicName, / \(.*\) */);
      if (!enlirRelic) {
        continue;
      }
      if (soul_strike) {
        compareGlEntity(soul_strike, enlir.soulBreaks, 'soul break', relicName);
      }
      if (legend_materia) {
        compareGlEntity(
          legend_materia,
          enlir.legendMateria,
          'legend materia',
          relicName,
          / \(.*\) */,
        );
      }
    }
  }
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
      checkGlRelicDrawBannerItems(data, currentTime);
    }
  },
};

export default itemUpdatesHandler;

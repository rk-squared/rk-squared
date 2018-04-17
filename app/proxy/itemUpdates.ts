import { Handler } from './types';

import enlir from '../data/enlir';
import { items, ItemType, ItemTypeLookup, ItemTypeName } from '../data/items';
import * as schemas from './schemas';

import * as _ from 'lodash';

// What's the best place to log these?  Use the console for now.
// tslint:disable no-console

let localItems = _.clone(items);
const localItemsById = _.zipObject(items.map(i => i.id), localItems);

interface PrizeItem {
  type_name: ItemTypeName;
  name: string;
  id: number;
}

function showUnknownItem(item: PrizeItem) {
  console.warn(`Unknown ${item.type_name.toLowerCase()}: ${item.name} (ID ${item.id})`);
}

function addLocalItem({name, type_name, id}: PrizeItem) {
  const type = ItemTypeLookup[type_name];
  const newItem = { name, type, id };
  localItems.push(newItem);
  localItems = _.sortBy(localItems, 'id');
  localItemsById[id] = newItem;
}

function showLocalItem(item: PrizeItem) {
  const type = ItemTypeLookup[item.type_name];
  console.log('New (previously unknown) item: ' +
    `{\n  name: '${item.name}',\n  type: ItemType.${type},\n  id: ${item.id}\n},`);
}

function checkKnownEnlir(item: PrizeItem, enlirData: any) {
  if (enlirData[item.id] == null) {
    showUnknownItem(item);
  }
}

function checkKnownItems(item: PrizeItem) {
  if (localItemsById[item.id] == null) {
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
  } else if (item.type_name === 'BUDDY' || item.type_name === 'MEMORY_CRYSTAL') {
    // FIXME: Need an internal-id-indexed version of characters and memory crystals
  } else {
    checkKnownItems(item);
  }
}

function checkPartyItems(partyItems: Array<{name: string, id: number}>, type: ItemType) {
  for (const i of _.sortBy(partyItems, 'id')) {
    checkKnownItems({name: i.name, id: i.id, type_name: type.toUpperCase() as ItemTypeName });
  }
}

const itemUpdates: Handler = {
  'dungeons'(data: schemas.Dungeons) {
    for (const d of data.dungeons) {
      _.forEach(d.prizes, prizeList => {
        for (const prize of prizeList) {
          checkItem(prize);
        }
      });
    }
  },

  'party/list'(data: schemas.PartyList) {
    checkPartyItems(data.equipment_hyper_evolve_materials, ItemType.DarkMatter);
    checkPartyItems(data.equipment_sp_materials, ItemType.UpgradeMaterial);
    checkPartyItems(data.materials, ItemType.Orb);
    checkPartyItems(data.grow_eggs, ItemType.GrowthEgg);
    checkPartyItems(data.sphere_materials, ItemType.Mote);
  },

  'win_battle'(data: schemas.WinBattle) {
    _.forEach(data.result.prize_master, item => {
      checkItem({id: +item.item_id, type_name: item.type_name, name: item.name});
    });
  }
};

export default itemUpdates;

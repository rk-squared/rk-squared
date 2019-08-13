/**
 * @file
 * URLs for static data and assets
 */

import { BaseUrl, LangType } from '../api/apiUrls';
import { dressRecordsById } from './dressRecords';
import { enlir } from './enlir';
import { itemsById, ItemType } from './items';

// Within the Electron app, use HTTP, so that our transparent proxy can serve
// resources without also having to implement HTTPS.
//
// Otherwise, use HTTPS, both to promote "HTTPS everywhere" and to avoid
// mixed content warnings for the web site version in particular.
const protocol = process.env.IS_ELECTRON ? 'http' : 'https';

const baseUrl: BaseUrl = {
  [LangType.Jp]: protocol + '://dff.sp.mbga.jp/dff/static/lang/',
  [LangType.Gl]: protocol + '://ffrk.denagames.com/dff/static/lang/ww/compile/en/',
};

export function url(lang: LangType, subPath: string): string {
  return baseUrl[lang] + subPath;
}

export function relativeUrl(lang: LangType, relativeUrlPath: string): string {
  return url(lang, relativeUrlPath.replace('/dff/static/lang/', ''));
}

export function asset(lang: LangType, assetPath?: string): string | undefined {
  return assetPath == null
    ? undefined
    : url(lang, assetPath.replace(/^\/Content\/lang\/(ww\/compile\/[a-z]+\/)?/, ''));
}

export function characterImage(lang: LangType, id: number): string {
  return url(lang, `image/buddy/${id}/${id}.png`);
}

export function dropItemImage(lang: LangType, id: number): string {
  return url(lang, `ab/battle/drop_icon/${id}.png`);
}

export function magiciteImage(lang: LangType, id: number): string {
  // Magicite skill image: purple circle background
  // return url(lang, `image/beast_active_skill/${id}1/${id}1_128.png`);
  // Item image: brown circle in a square, with element and rarity overlay icons
  return itemImage(lang, id, ItemType.Magicite);
}

// Record materia with an item background, as shown when it first drops
export function recordMateriaDropImage(lang: LangType, id: number): string {
  return url(lang, `image/record_materia/${id}/${id}_112.png`);
}

// Normal record materia image, as shown on the character screen
export function recordMateriaImage(lang: LangType, id: number): string {
  return url(lang, `image/record_materia/${id}/${id}_128.png`);
}

export function relicImage(lang: LangType, id: number, rarity: number): string {
  return url(lang, `image/equipment/${id}/${id}_0${rarity}_112.png`);
}

export function itemImage(lang: LangType, id: number, type: ItemType): string {
  switch (type) {
    case ItemType.Common: {
      const urlPath =
        itemsById[id] && itemsById[id].internalType
          ? itemsById[id].internalType!.toLowerCase()
          : 'common_item';
      return url(lang, `image/${urlPath}/${id}.png`);
    }
    case ItemType.GrowthEgg:
      return url(lang, `image/growegg/${id}/${id}_112.png`);
    case ItemType.Ability:
    case ItemType.Arcana:
    case ItemType.CrystalWater:
    case ItemType.DarkMatter:
    case ItemType.Magicite:
    case ItemType.MemoryCrystal:
    case ItemType.Mote:
    case ItemType.Orb:
    case ItemType.UpgradeMaterial:
      return url(lang, `image/${type}/${id}/${id}_112.png`);
    case ItemType.Relic: {
      const relic = enlir.relics[id];

      // For Octopath Traveler, a new collaboration event resulted in a 5*
      // accessory that wasn't in Enlir.  It's probably safe to assume that any
      // unknown relics are of that sort and that JP foresight will take care
      // of the rest.
      const rarity = relic ? relic.rarity : 5;

      return relicImage(lang, id, rarity);
    }
    case ItemType.Character:
      return characterImage(lang, id);
    case ItemType.DressRecord:
      // Dress record URLs embed the character ID, but tracking and passing
      // that through to here would complicate the code, so we instead maintain
      // a list of known dress record IDs.
      //
      // Fall back to dress record ID if it's an unknown dress record.
      // This will fail but will avoid an error.
      const buddyId = dressRecordsById[id] ? dressRecordsById[id].characterId : id;
      return url(lang, `image/buddy/${buddyId}/${id}/${id}.png`);
    case ItemType.RecordMateria:
      return recordMateriaImage(lang, id);
    case ItemType.DropItem:
      return dropItemImage(lang, id);
    case ItemType.Music:
      return url(lang, 'image/music_ticket/music_ticket.png');
  }
}

export function seriesIcon(lang: LangType, seriesId: number): string | null {
  if (seriesId >= 101001 && seriesId <= 115001 && seriesId % 1000 === 1) {
    const series = Math.floor((seriesId - 100000) / 1000);
    return url(lang, `image/event_intro/common/pict/icon_series_${series}.png`);
  } else if (seriesId === 150001) {
    return url(lang, `image/event_intro/common/pict/icon_series_fft.png`);
  } else if (seriesId === 160001) {
    return url(lang, `image/event_intro/common/pict/icon_series_type0.png`);
  } else {
    return null;
  }
}

export function crystalTowerFloorIcon(lang: LangType, id: number): string {
  return url(lang, `image/crystal_tower/floor_icon/${id}.png`);
}

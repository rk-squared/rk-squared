import enlir from './enlir';
import { ItemType } from './items';

const baseUrl = 'http://ffrk.denagames.com/dff/static/lang/ww/compile/en/';

export function url(subPath: string): string {
  return baseUrl + subPath;
}

export function asset(assetPath?: string): string | undefined {
  return assetPath == null ? undefined : url(assetPath.replace('/Content/lang/', ''));
}

export function magiciteImage(id: number): string {
  // Magicite skill image: purple circle background
  // return url(`image/beast_active_skill/${id}1/${id}1_128.png`);
  // Item image: brown circle in a square, with element and rarity overlay icons
  return itemImage(id, ItemType.Magicite);
}

export function relicImage(id: number, rarity: number): string {
  return url(`equipment/${id}/${id}_${rarity}_112.png`);
}

export function itemImage(id: number, type: ItemType): string {
  switch (type) {
    case ItemType.Common:
      return url(`image/common_item/${id}/${id}.png`);
    case ItemType.GrowthEgg:
      return url(`image/growegg/${id}/${id}_112.png`);
    case ItemType.Arcana:
    case ItemType.Magicite:
    case ItemType.MemoryCrystal:
    case ItemType.Orb:
    case ItemType.UpgradeMaterial:
      return url(`image/${type}/${id}/${id}_112.png`);
    case ItemType.Relic:
      const rarity = enlir.relics[id].Rarity;
      return url(`image/equipment/${id}/${id}_${rarity}_112.png`);
    case ItemType.Character:
      return url(`image/buddy/${id}/${id}.png`);
  }
}

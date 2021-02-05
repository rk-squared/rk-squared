/**
 * @file
 * URLs for FFRK APIs
 */

export enum LangType {
  Gl = 'gl',
  Jp = 'jp',
}

export type BaseUrl = { [lang in LangType]: string };

const baseUrl: BaseUrl = {
  [LangType.Jp]: 'http://dff.sp.mbga.jp/dff/',
  [LangType.Gl]: 'http://ffrk.denagames.com/dff/',
};

export const dungeons = (lang: LangType, worldId: number) =>
  `${baseUrl[lang]}world/dungeons?world_id=${worldId}`;

export const gachaShow = (lang: LangType) => `${baseUrl[lang]}gacha/show`;

export const gachaProbability = (lang: LangType, bannerId: number, hash?: string) =>
  `${baseUrl[lang]}gacha/probability?series_id=${bannerId}` + (hash ? `&hash_value=${hash}` : '');

export const exchangeShopPrizeList = (lang: LangType, exchangeShopId: number) =>
  `${baseUrl[lang]}exchange_shop/prize_list?shop_id=${exchangeShopId}`;

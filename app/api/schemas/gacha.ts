import { AssetCollection, NumberAsString } from './common';
import { Equipment } from './equipment';

// Sample URL: http://ffrk.denagames.com/dff/gacha/show
export interface GachaShow {
  success: boolean;
  SERVER_TIME: number;
  is_closed_sefirosu_event: number;
  gacha_group: GachaGroup[];
  series_list: GachaSeriesList[];
  soul_piece_num: NumberAsString; // mythril amount
  config: GachaConfig;
  bgm_assets: AssetCollection;
}

interface GachaConfig {
  // Cost in gems for a half-price 11x pull
  pay_cost_011_half: number;
  // Cost in gems for a full-price 1x pull
  pay_cost_001: number;
}

interface GachaGroup {
  priority: number; // 0 means free daily draw and no-longer-active promos (like Genji set)
  closed_at: number;
  line_up_image_path: string;
  content_series_ids: number[];
  series_id: number;
  opened_at: number;
  tab_type_list: number[];
  show_closed_at_flg: boolean;
  href: string;
  id: number;
}

/**
 * Used to group series happy draws (realms on parade)
 */
interface GachaSeriesList {
  priority: number;
  user_exchange_shop_exchanged_num: number;
  closed_at: number;
  rise_message: string;
  is_book_gacha: boolean;
  banner_list: BannerList[];
  line_up_image_path: string;
  logic_name: LogicType;
  box_list: BoxList[];
  is_all_free_payment: boolean;
  user_exchange_shop_prize_num: number;
  show_prob_rise_flg: boolean;
  additional_appeal_type: number;
  bgm: string;
  rise_image_path: string;
  series_name: string;
  tab_type_list: number[];
  bgm_id: number;
  total_executable_num: number;
  appeal_message: string;
  top_image_path: string;
  series_id: number;
  opened_at: number;
  line_up_disable_image_path: string;
  exchange_shop_id: number;
  show_closed_at_flg: boolean;
}

interface BannerList {
  wiki_url?: null | string;
  banner_image_type: number;
  item_id: number;
  disp_order: number;
  gacha_series_id: number;
  image_path: string;
  font_type: number;
  type: number;
  id: number;
  buddy_image_path: string;
  equipment?: Equipment;
}

interface BoxList {
  match_condition_list: any[];
  box_id: number;
  rarities: number[];
  entry_point_list: EntryPointList[];
}

interface EntryPointList {
  purchased_count: number;
  disp_depth: number;
  closed_at: number;
  pay_type_name: PayType;
  entry_point_id: number;
  is_normal_gacha: boolean;
  animation_type_name: AnimationTypeName;
  limit_type_name: LimitTypeName;
  executable_num: number;
  lot_num: number;
  image_id: number;
  pay_id: number; // 0 for gems or 91000000 for mythril
  required_user_item?: RequiredUserItem;
  tag: string;
  pay_cost: number;
  name: Name;
  description: Description;
  opened_at: number;
  coin_cost_of_item_and_coin_payment: number;
  disp_order: number;
  show_closed_at_flg: boolean;
  term_limit_num: number;
}

enum AnimationTypeName {
  Empty = '',
  Fee = 'fee',
}

enum Description {
  Empty = '',
  NeedTranslateText = '### need_translate_text ###',
}

enum LimitTypeName {
  Infinity = 'infinity',
  Today = 'today',
  Total = 'total',
}

enum Name {
  FirstRelicDraw = 'First Relic Draw',
  Free = 'Free',
  RareRelicDraw = 'Rare Relic Draw',
  RareRelicDrawX11 = 'Rare Relic Draw x11',
  RareRelicDrawX3 = 'Rare Relic Draw x 3',
  The100GemRareRelicDraw = '100-Gem Rare Relic Draw',
}

enum PayType {
  Coin = 'coin',
  Free = 'free',
  Item = 'item',
  ItemAndCoin = 'item_and_coin',
}

/**
 * Items needed to do a relic draw.  This is usually 91000000 ("Mythril"), but
 * Acolyte Archives draws use 95003001 through 95003009.
 */
interface RequiredUserItem {
  num: number;
  image_path: string;
  name: string;
  item_id: number;
}

enum LogicType {
  Plain = 'plain',
  RarityAssurance = 'rarity_assurance',
}

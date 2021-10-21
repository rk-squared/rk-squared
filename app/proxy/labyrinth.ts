/**
 * @file
 * Support for tracking labyrinth
 */

import { Store } from 'redux';
import { LangType } from '../api/apiUrls';
import * as labyrinthSchemas from '../api/schemas/labyrinth';
import { Handler, HandlerRequest, getRequestLang } from './common';
import { relativeUrl } from '../data/urls';
import { IState } from '../reducers';
import {
  clearLabyrinthChests,
  clearLabyrinthCombat,
  clearLabyrinthPartyFatigues,
  LabyrinthCombat,
  LabyrinthPainting,
  LabyrinthParty,
  setLabyrinthChests,
  setLabyrinthCombat,
  setLabyrinthDungeon,
  setLabyrinthPaintings,
  setLabyrinthParties,
  setLabyrinthPartyFatigues,
} from '../actions/labyrinth';
import { sanitizeBattleMessage, parseBattleTips } from '../data/strategy';
import { isLabyrinthPartyList } from '../api/schemas';

function getPaintingCombat(lang: LangType, dungeon: labyrinthSchemas.Dungeon): LabyrinthCombat {
  const tip = dungeon.captures[0].tip_battle;
  return {
    name: tip.title.replace(' (Labyrinth)', ''),
    difficulty: dungeon.challenge_level,
    imageUrl: relativeUrl(lang, dungeon.captures[0].image_path),
    message: sanitizeBattleMessage(tip.message),
    tips: parseBattleTips(tip.html_content),
    dungeonId: dungeon.id
  };
}

function convertLabyrinthPaintings(
  lang: LangType,
  session: labyrinthSchemas.LabyrinthDungeonSession,
): LabyrinthPainting[] {
  return session.display_paintings.map((i) => ({
    id: i.painting_id,
    name: i.name,
    number: i.no,
    combat: i.dungeon && getPaintingCombat(lang, i.dungeon),
  }));
}

function processLabyrinthSession(
  lang: LangType,
  session: labyrinthSchemas.LabyrinthDungeonSession,
  store: Store<IState>,
) {
  const paintings = convertLabyrinthPaintings(lang, session);
  store.dispatch(setLabyrinthPaintings(paintings, session.remaining_painting_num, session.current_floor));

  if (session.treasure_chest_ids) {
    store.dispatch(setLabyrinthChests(session.treasure_chest_ids));
  } else {
    store.dispatch(clearLabyrinthChests());
  }

  if (session.dungeon) {
    const combat = getPaintingCombat(lang, session.dungeon);
    store.dispatch(setLabyrinthCombat(combat));
  } else {
    store.dispatch(clearLabyrinthCombat());
    store.dispatch(clearLabyrinthPartyFatigues());
  }
}

function processLabyrinthBuddyInfo(info: labyrinthSchemas.LabyrinthBuddyInfo, store: Store<IState>) {
  const abrasions: Record<string, number> = info.memory_abrasions
    .reduce((p, c) => ({ ...p, [c.user_buddy_id]: Number(c.memory_abrasion) }), {});
  store.dispatch(setLabyrinthPartyFatigues(abrasions));
}

function processLabyrinthPartyList(parties: labyrinthSchemas.Party[], store: Store<IState>) {
  const result = parties.map(p => {
    const buddies: number[] = Object.entries(p.slot_to_buddy_id).map(b => b[1]);
    return <LabyrinthParty>
      {
        no: p.party_no,
        buddies: buddies
      }
  });
  store.dispatch(setLabyrinthParties(result));
}

function processLabyrinthSelectDungeon(dungeonId: number, store: Store<IState>) {
  store.dispatch(setLabyrinthDungeon(dungeonId));
}

function buddy_info(data: labyrinthSchemas.LabyrinthBuddyInfoData, store: Store<IState>) {
  processLabyrinthBuddyInfo(data.labyrinth_buddy_info, store);
}

function party_list(data: labyrinthSchemas.LabyrinthPartyList, store: Store<IState>, request: HandlerRequest) {
  if (!isLabyrinthPartyList(request.url)) {
    return;
  }
  processLabyrinthPartyList(data.parties, store);
}

const labyrinthHandler: Handler = {
  get_display_paintings(data: labyrinthSchemas.LabyrinthDisplayPaintings, store, request) {
    processLabyrinthSession(getRequestLang(request), data.labyrinth_dungeon_session, store);
  },

  select_painting(data: labyrinthSchemas.LabyrinthSelectPainting, store, request: HandlerRequest) {
    processLabyrinthSession(getRequestLang(request), data.labyrinth_dungeon_session, store);
  },

  choose_explore_painting(data: labyrinthSchemas.LabyrinthChooseExplorePainting, store, request) {
    processLabyrinthSession(getRequestLang(request), data.labyrinth_dungeon_session, store);
  },

  finish_current_painting(data: labyrinthSchemas.LabyrinthFinishPainting, store) {
    store.dispatch(clearLabyrinthChests());
    store.dispatch(clearLabyrinthCombat());
  },

  'party/list': party_list,
  'buddy/info': buddy_info,

  dungeon_recommend_info(data: any, store, { query }: HandlerRequest) {
    processLabyrinthSelectDungeon(Number(query.dungeon_id), store);
  }
};

export default labyrinthHandler;

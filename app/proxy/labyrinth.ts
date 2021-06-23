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
  LabyrinthCombat,
  LabyrinthPainting,
  setLabyrinthChests,
  setLabyrinthCombat,
  setLabyrinthPaintings,
} from '../actions/labyrinth';
import { sanitizeBattleMessage, parseBattleTips } from '../data/strategy';

function getPaintingCombat(lang: LangType, dungeon: labyrinthSchemas.Dungeon): LabyrinthCombat {
  const tip = dungeon.captures[0].tip_battle;
  return {
    name: tip.title.replace(' (Labyrinth)', ''),
    difficulty: dungeon.challenge_level,
    imageUrl: relativeUrl(lang, dungeon.captures[0].image_path),
    message: sanitizeBattleMessage(tip.message),
    tips: parseBattleTips(tip.html_content),
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
  store.dispatch(setLabyrinthPaintings(paintings, session.remaining_painting_num));

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
  }
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
};

export default labyrinthHandler;

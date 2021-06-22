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
import { LabyrinthCombat, LabyrinthPainting, setLabyrinthPaintings } from '../actions/labyrinth';
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

const labyrinthHandler: Handler = {
  get_display_paintings(
    data: labyrinthSchemas.LabyrinthDisplayPaintings,
    store: Store<IState>,
    request: HandlerRequest,
  ) {
    const session = data.labyrinth_dungeon_session;
    const paintings = convertLabyrinthPaintings(getRequestLang(request), session);
    store.dispatch(setLabyrinthPaintings(paintings, session.remaining_painting_num));
  },

  select_painting(
    data: labyrinthSchemas.LabyrinthSelectPainting,
    store: Store<IState>,
    request: HandlerRequest,
  ) {
    const session = data.labyrinth_dungeon_session;
    const paintings = convertLabyrinthPaintings(getRequestLang(request), session);
    store.dispatch(setLabyrinthPaintings(paintings, session.remaining_painting_num));
  },
};

export default labyrinthHandler;

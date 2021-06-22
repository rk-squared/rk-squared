/**
 * @file
 * Support for tracking labyrinth
 */

import { Store } from 'redux';

import * as labyrinthSchemas from '../api/schemas/labyrinth';
import { Handler } from './common';
import { IState } from '../reducers';
import { setLabyrinthPaintings, LabyrinthPainting } from '../actions/labyrinth';
import { sanitizeBattleMessage, parseBattleTips } from '../data/strategy';

function getPaintingCombat(dungeon: labyrinthSchemas.Dungeon): LabyrinthPainting['combat'] {
  const tip = dungeon.captures[0].tip_battle;
  return {
    name: tip.title.replace(' (Labyrinth)', ''),
    difficulty: dungeon.challenge_level,
    message: sanitizeBattleMessage(tip.message),
    tips: parseBattleTips(tip.html_content),
  };
}

function convertLabyrinthPaintings(
  session: labyrinthSchemas.LabyrinthDungeonSession,
): LabyrinthPainting[] {
  return session.display_paintings.map((i) => ({
    id: i.painting_id,
    name: i.name,
    number: i.no,
    combat: i.dungeon && getPaintingCombat(i.dungeon),
  }));
}

const labyrinthHandler: Handler = {
  get_display_paintings(data: labyrinthSchemas.LabyrinthDisplayPaintings, store: Store<IState>) {
    const session = data.labyrinth_dungeon_session;
    const paintings = convertLabyrinthPaintings(session);
    store.dispatch(setLabyrinthPaintings(paintings, session.remaining_painting_num));
  },

  select_painting(data: labyrinthSchemas.LabyrinthSelectPainting, store: Store<IState>) {
    const session = data.labyrinth_dungeon_session;
    const paintings = convertLabyrinthPaintings(session);
    store.dispatch(setLabyrinthPaintings(paintings, session.remaining_painting_num));
  },
};

export default labyrinthHandler;

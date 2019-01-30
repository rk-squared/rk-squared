import { Store } from 'redux';

import { DungeonScoreType, setDungeonScore, updateDungeonScore } from '../actions/dungeonScores';
import { WorldCategory } from '../actions/worlds';
import * as schemas from '../api/schemas';
import { GradeScoreType } from '../api/schemas/battles';
import { IState } from '../reducers';
import { getWorldIdForDungeon } from '../reducers/dungeons';
import { Handler } from './types';

function gradeToScoreType(type: GradeScoreType): DungeonScoreType | null {
  switch (type) {
    case GradeScoreType.DecreasedHp:
      return DungeonScoreType.TotalDamage;
    case GradeScoreType.DecreasedHpAndClearTime:
      return DungeonScoreType.PercentHpOrClearTime;
  }
  return null;
}

function checkForMagiciteWin(data: schemas.WinBattle, store: Store<IState>) {
  if (!data.result.clear_time_info || !data.result.clear_time_info.clear_battle_time) {
    return;
  }
  // We could check data.result.clear_time_info.can_show_clear_time, but
  // it's sometimes false, even for magicite.

  const dungeonId = +data.result.dungeon_id;
  const state = store.getState();
  const worldId = getWorldIdForDungeon(state.dungeons, dungeonId);
  if (worldId == null) {
    return;
  }

  const world = state.worlds.worlds && state.worlds.worlds[worldId];
  if (!world || world.category !== WorldCategory.Magicite) {
    return;
  }

  store.dispatch(
    updateDungeonScore(dungeonId, {
      type: DungeonScoreType.ClearTime,
      time: +data.result.clear_time_info.clear_battle_time,
      won: true,
    }),
  );
}

function handleWinBattle(data: schemas.WinBattle, store: Store<IState>) {
  checkForMagiciteWin(data, store);
}

const dungeonScoresHandler: Handler = {
  battles(data: schemas.Battles, store: Store<IState>) {
    for (const i of data.battles) {
      if (i.user_clear_time) {
        store.dispatch(
          setDungeonScore(i.dungeon_id, {
            type: DungeonScoreType.ClearTime,
            time: i.user_clear_time,
            won: true,
          }),
        );
      } else if (i.grade_score_type && i.grade_score) {
        const type = gradeToScoreType(i.grade_score_type);
        if (type) {
          store.dispatch(
            setDungeonScore(i.dungeon_id, {
              type,
              time: i.grade_score.elapsedBattleTimeFromBeginning,
              totalDamage: i.grade_score.decreasedAmountOfHp,
              maxHp: i.grade_score.maxHp,
              won: i.grade_score.isDefeated,
            }),
          );
        }
      }
    }
  },

  win_battle: handleWinBattle,
  battle_win: handleWinBattle,
  'battle/win': handleWinBattle,
};

export default dungeonScoresHandler;

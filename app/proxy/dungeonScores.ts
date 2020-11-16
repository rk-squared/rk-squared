/**
 * @file
 * Support for tracking dungeon scores (torment and magicite completion times
 * and percents) and Dark Odin progress
 */

import { Store } from 'redux';

import * as _ from 'lodash';

import {
  DungeonScoreType,
  setDungeonScore,
  updateDungeonElementScore,
  updateDungeonScore,
} from '../actions/dungeonScores';
import { WorldCategory } from '../actions/worlds';
import * as schemas from '../api/schemas';
import { GradeScoreType } from '../api/schemas/battles';
import * as dungeonsSchemas from '../api/schemas/dungeons';
import { EnlirElement } from '../data/enlir';
import { IState } from '../reducers';
import { getWorldIdForDungeon } from '../reducers/dungeons';
import { logger } from '../utils/logger';
import { Handler, HandlerRequest } from './common';

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

const elementRewards: Array<[dungeonsSchemas.RewardType, EnlirElement]> = [
  [dungeonsSchemas.RewardType.ElementalFire, 'Fire'],
  [dungeonsSchemas.RewardType.ElementalIce, 'Ice'],
  [dungeonsSchemas.RewardType.ElementalWind, 'Wind'],
  [dungeonsSchemas.RewardType.ElementalEarth, 'Earth'],
  [dungeonsSchemas.RewardType.ElementalLightning, 'Lightning'],
  [dungeonsSchemas.RewardType.ElementalWater, 'Water'],
  [dungeonsSchemas.RewardType.ElementalHoly, 'Holy'],
  [dungeonsSchemas.RewardType.ElementalDark, 'Dark'],
];

export function getElementsClaimed({ prizes }: dungeonsSchemas.Dungeon) {
  const claimed: EnlirElement[] = [];
  const unclaimed: EnlirElement[] = [];
  for (const [reward, element] of elementRewards) {
    if (prizes[reward] && _.some(prizes[reward], i => i.is_got_grade_bonus_prize)) {
      claimed.push(element);
    } else {
      unclaimed.push(element);
    }
  }
  return { claimed, unclaimed };
}

function updateElementScores(
  store: Store<IState>,
  dungeonId: number,
  elements: EnlirElement[],
  won: boolean,
) {
  for (const i of elements) {
    store.dispatch(
      updateDungeonElementScore(dungeonId, i, {
        type: DungeonScoreType.ClearTime,
        won,
      }),
    );
  }
}

const dungeonScoresHandler: Handler = {
  battles(data: schemas.Battles, store: Store<IState>) {
    for (const i of data.battles) {
      if (i.grade_score_type && i.grade_score) {
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
      } else if (i.user_clear_time) {
        store.dispatch(
          setDungeonScore(i.dungeon_id, {
            type: DungeonScoreType.ClearTime,
            time: i.user_clear_time,
            won: true,
          }),
        );
      }
    }
  },

  win_battle: handleWinBattle,
  battle_win: handleWinBattle,
  'battle/win': handleWinBattle,

  dungeons(data: dungeonsSchemas.Dungeons, store: Store<IState>, { query }: HandlerRequest) {
    if (!query || !query.world_id) {
      logger.error('Unrecognized dungeons query');
      return;
    }
    if (+query.world_id !== dungeonsSchemas.DarkOdinWorldId) {
      return;
    }
    if (data.dungeons.length !== 1) {
      logger.error('Unrecognized Dark Odin data');
      return;
    }

    const dungeon = data.dungeons[0];
    const elements = getElementsClaimed(dungeon);
    updateElementScores(store, dungeon.id, elements.claimed, true);
    updateElementScores(store, dungeon.id, elements.unclaimed, false);
  },
};

export default dungeonScoresHandler;

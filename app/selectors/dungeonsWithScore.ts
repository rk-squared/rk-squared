import { createSelector } from 'reselect';

import { Dungeon } from '../actions/dungeons';
import { DungeonScore } from '../actions/dungeonScores';
import { getSorter, World, WorldCategory } from '../actions/worlds';
import { IState } from '../reducers';
import { DungeonState, getDungeonsForWorld } from '../reducers/dungeons';
import { DungeonScoreState } from '../reducers/dungeonScores';
import { WorldState } from '../reducers/worlds';

import * as _ from 'lodash';

export interface DungeonWithScore extends Dungeon {
  score: DungeonScore | undefined;
}

export interface TormentWorldWithScore extends World {
  d240?: DungeonWithScore;
  d280?: DungeonWithScore;
  dUnknown?: DungeonWithScore;
}

function getDungeonsWithScoreForWorld(
  dungeonState: DungeonState,
  scoresState: DungeonScoreState,
  worldId: number,
) {
  const dungeons = getDungeonsForWorld(dungeonState, worldId);
  if (!dungeons) {
    return undefined;
  }
  return dungeons.map(d => ({
    ...d,
    score: scoresState.scores[d.id],
  }));
}

export const getTormentScores = createSelector<
  IState,
  WorldState,
  DungeonState,
  DungeonScoreState,
  TormentWorldWithScore[]
>(
  [
    (state: IState) => state.worlds,
    (state: IState) => state.dungeons,
    (state: IState) => state.dungeonScores,
  ],
  (worldsState: WorldState, dungeonsState: DungeonState, scoresState: DungeonScoreState) => {
    const worlds = getSorter(WorldCategory.Torment)(
      _.values(worldsState.worlds).filter(i => i.category === WorldCategory.Torment),
    );
    return worlds.map(w => {
      const dungeons = _.keyBy(
        getDungeonsWithScoreForWorld(dungeonsState, scoresState, w.id) || [],
        'difficulty',
      );
      return {
        ...w,
        d240: dungeons[240],
        d280: dungeons[280],
        dUnknown: dungeons[0],
      };
    });
  },
);

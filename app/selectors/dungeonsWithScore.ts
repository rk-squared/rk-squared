import { createSelector } from 'reselect';

import { Dungeon } from '../actions/dungeons';
import { DungeonScore, estimateScore } from '../actions/dungeonScores';
import { getSorter, World, WorldCategory } from '../actions/worlds';
import { IState } from '../reducers';
import { DungeonState, getDungeonsForWorld } from '../reducers/dungeons';
import { DungeonScoreState } from '../reducers/dungeonScores';
import { WorldState } from '../reducers/worlds';

import * as _ from 'lodash';

export interface DungeonWithScore extends Dungeon {
  score: DungeonScore | undefined;
  estimatedScore: DungeonScore | undefined;
}

export interface TormentWorldWithScore extends World {
  d240?: DungeonWithScore;
  d280?: DungeonWithScore;
  dUnknown?: DungeonWithScore;
}

function getDungeonsWithScoreForWorld(
  dungeonState: DungeonState,
  scoresState: DungeonScoreState,
  world: World,
) {
  const dungeons = getDungeonsForWorld(dungeonState, world.id);
  if (!dungeons) {
    return undefined;
  }
  return dungeons.map(d => ({
    ...d,
    score: scoresState.scores[d.id],
    estimatedScore: estimateScore(d, world) || undefined,
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
      const dungeons: { [dungeonId: number]: DungeonWithScore } = _.keyBy(
        getDungeonsWithScoreForWorld(dungeonsState, scoresState, w) || [],
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

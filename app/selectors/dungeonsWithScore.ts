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
  world: World;
}

export function makeDungeonsWithScoresSelector(category: WorldCategory) {
  return createSelector<IState, WorldState, DungeonState, DungeonScoreState, DungeonWithScore[]>(
    [
      (state: IState) => state.worlds,
      (state: IState) => state.dungeons,
      (state: IState) => state.dungeonScores,
    ],
    (worldsState: WorldState, dungeonsState: DungeonState, scoresState: DungeonScoreState) => {
      const worlds = getSorter(category)(
        _.values(worldsState.worlds).filter(i => i.category === category),
      );
      return _.flatten(
        worlds.map(w => {
          const dungeons = getDungeonsForWorld(dungeonsState, w.id) || [];
          return dungeons.map(d => ({
            ...d,
            world: w,
            score: scoresState.scores[d.id],
          }));
        }),
      );
    },
  );
}
